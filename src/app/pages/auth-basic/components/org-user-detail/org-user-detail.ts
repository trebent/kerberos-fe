import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

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
 * Edits an organisation user's name, groups and password. Open it with `MatDialog`. It holds
 * several forms, so it stays open after a save; the caller reloads the user list when it closes.
 */
@Component({
  imports: [
    CheckboxGroup,
    EditDialog,
    ErrorDisplay,
    FormField,
    FormRoot,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
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
  private readonly orgId = inject<OrgUserDetailData>(MAT_DIALOG_DATA).orgId;
  private readonly user = inject<OrgUserDetailData>(MAT_DIALOG_DATA).user;

  /** The organisation's groups, and the ones this user is in. */
  protected readonly groupsResource = rxResource({
    stream: () =>
      forkJoin({
        all: this.groupsService.listGroups(this.orgId),
        member: this.usersService.getUserGroups(this.orgId, this.user.id),
      }),
  });
  protected readonly selectedGroups = new IdSelection();

  protected readonly nameStatus = requestStatus({
    failure: 'Failed to update name. Please try again.',
    success: 'Name updated successfully.',
  });
  protected readonly groupsStatus = requestStatus({
    failure: 'Failed to update groups. Please try again.',
    success: 'Groups updated successfully.',
  });

  protected readonly nameForm = form(
    signal({ name: this.user.name }),
    (path) => required(path.name),
    { submission: { action: async () => this.saveName() } },
  );

  protected readonly changePassword: ChangePassword = (oldPassword, newPassword) =>
    this.usersService.changePassword(this.orgId, this.user.id, {
      oldPassword,
      password: newPassword,
    });

  constructor() {
    effect(() => {
      if (this.groupsResource.hasValue()) {
        this.selectedGroups.set(this.groupsResource.value().member.map((group) => group.id));
      }
    });
  }

  private saveName(): void {
    const { id } = this.user;
    const request$ = this.usersService.updateUser(this.orgId, id, {
      id,
      ...this.nameForm().value(),
    });
    this.nameStatus.run(request$);
  }

  protected saveGroups(): void {
    if (!this.groupsResource.hasValue()) return;
    const groups = this.groupsResource.value().all.filter((g) => this.selectedGroups.has(g.id));
    this.groupsStatus.run(this.usersService.updateUserGroups(this.orgId, this.user.id, groups));
  }
}
