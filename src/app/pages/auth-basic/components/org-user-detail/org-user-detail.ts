import { Component, effect, inject, input, linkedSignal, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import {
  ChangePassword,
  PasswordChange,
} from '../../../../components/password-change/password-change';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { GroupsService, User, UsersService } from '../../../../services/auth-basic';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

@Component({
  imports: [
    EditPanel,
    ErrorDisplay,
    FormField,
    FormRoot,
    MatButton,
    MatCheckbox,
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

  readonly orgId = input.required<number>();
  readonly user = input.required<User>();

  /** The user was changed. The panel stays open, as it holds several forms. */
  readonly changed = output<void>();
  readonly closed = output<void>();

  /** The organisation's groups, and the ones this user is in. */
  protected readonly groupsResource = rxResource({
    params: () => ({ orgId: this.orgId(), userId: this.user().id }),
    stream: ({ params: { orgId, userId } }) =>
      forkJoin({
        all: this.groupsService.listGroups(orgId),
        member: this.usersService.getUserGroups(orgId, userId),
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
    linkedSignal(() => ({ name: this.user().name })),
    (path) => required(path.name),
    { submission: { action: async () => this.saveName() } },
  );

  protected readonly changePassword: ChangePassword = (oldPassword, newPassword) =>
    this.usersService.changePassword(this.orgId(), this.user().id, {
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
    const { id } = this.user();
    const request$ = this.usersService.updateUser(this.orgId(), id, {
      id,
      ...this.nameForm().value(),
    });
    this.nameStatus.run(request$, () => this.changed.emit());
  }

  protected saveGroups(): void {
    if (!this.groupsResource.hasValue()) return;
    const groups = this.groupsResource.value().all.filter((g) => this.selectedGroups.has(g.id));
    const request$ = this.usersService.updateUserGroups(this.orgId(), this.user().id, groups);
    this.groupsStatus.run(request$, () => this.changed.emit());
  }
}
