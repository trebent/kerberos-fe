import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { forkJoin, Observable } from 'rxjs';

import { CheckboxGroup } from '../../../../components/checkbox-group/checkbox-group';
import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import {
  ChangePassword,
  PasswordChange,
} from '../../../../components/password-change/password-change';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { GroupsService, User, UsersService } from '../../../../services/auth-basic';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

export interface OrgUserDetailData {
  orgId: number;
  user: User;
}

/**
 * Edits an organisation user. The name and groups save together and close the dialog with the
 * saved name. Changing the password is a separate action that keeps the dialog open.
 */
@Component({
  imports: [
    CheckboxGroup,
    EditDialog,
    ErrorDisplay,
    FormField,
    FormRoot,
    MatButton,
    MatDialogClose,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    PasswordChange,
    RequestFeedback,
  ],
  selector: 'app-org-user-detail',
  styleUrl: './org-user-detail.scss',
  templateUrl: './org-user-detail.html',
})
export class OrgUserDetail {
  private readonly usersService = inject(UsersService);
  private readonly groupsService = inject(GroupsService);
  private readonly dialogRef = inject<MatDialogRef<OrgUserDetail, string>>(MatDialogRef);
  private readonly data = inject<OrgUserDetailData>(MAT_DIALOG_DATA);
  private readonly orgId = this.data.orgId;
  private readonly user = this.data.user;

  /** The organisation's groups, and the ones this user is in. */
  protected readonly groupsResource = rxResource({
    stream: () =>
      forkJoin({
        all: this.groupsService.listGroups(this.orgId),
        member: this.usersService.getUserGroups(this.orgId, this.user.id),
      }),
  });
  /** Ticks the groups the user is in once they have loaded. */
  protected readonly selectedGroups = new IdSelection(() =>
    this.groupsResource.hasValue()
      ? this.groupsResource.value().member.map((group) => group.id)
      : [],
  );

  protected readonly saveStatus = requestStatus({
    failure: 'Failed to save. Please try again.',
  });

  protected readonly form = form(signal({ name: this.user.name }), (path) => required(path.name), {
    submission: { action: async () => this.save() },
  });

  protected readonly changePassword: ChangePassword = (oldPassword, newPassword) =>
    this.usersService.changePassword(this.orgId, this.user.id, {
      oldPassword,
      password: newPassword,
    });

  /** Saves the name, and the groups when they loaded; the two endpoints are independent. */
  private save(): void {
    const { id } = this.user;
    const { name } = this.form().value();
    const requests: Observable<unknown>[] = [
      this.usersService.updateUser(this.orgId, id, { id, name }),
    ];
    if (this.groupsResource.hasValue()) {
      const groups = this.groupsResource.value().all.filter((g) => this.selectedGroups.has(g.id));
      requests.push(this.usersService.updateUserGroups(this.orgId, id, groups));
    }
    this.saveStatus.run(forkJoin(requests), () => this.dialogRef.close(name));
  }
}
