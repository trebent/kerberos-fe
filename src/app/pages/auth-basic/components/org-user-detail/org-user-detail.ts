import { rxResource } from '@angular/core/rxjs-interop';
import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { GroupsService, User, UsersService } from '../../../../services/auth-basic';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';
import {
  PasswordMismatchStateMatcher,
  passwordsMatchValidator,
} from '../../../../utils/validation';

@Component({
  imports: [
    ErrorDisplay,
    RequestFeedback,
    EditPanel,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ReactiveFormsModule,
  ],
  selector: 'app-org-user-detail',
  styleUrl: './org-user-detail.scss',
  templateUrl: './org-user-detail.html',
})
export class OrgUserDetail {
  private readonly usersService = inject(UsersService);
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  protected readonly mismatchMatcher = new PasswordMismatchStateMatcher();

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
  protected readonly passwordStatus = requestStatus({
    failure: 'Failed to change password. Please check your current password and try again.',
    success: 'Password changed successfully.',
  });

  protected readonly nameForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  constructor() {
    effect(() => this.nameForm.reset({ name: this.user().name }));
    effect(() => {
      if (this.groupsResource.hasValue()) {
        this.selectedGroups.set(this.groupsResource.value().member.map((group) => group.id));
      }
    });
  }

  protected saveName(): void {
    if (this.nameForm.invalid) return;
    const { id } = this.user();
    const request$ = this.usersService.updateUser(this.orgId(), id, {
      id,
      ...this.nameForm.getRawValue(),
    });
    this.nameStatus.run(request$, () => this.changed.emit());
  }

  protected saveGroups(): void {
    if (!this.groupsResource.hasValue()) return;
    const groups = this.groupsResource.value().all.filter((g) => this.selectedGroups.has(g.id));
    const request$ = this.usersService.updateUserGroups(this.orgId(), this.user().id, groups);
    this.groupsStatus.run(request$, () => this.changed.emit());
  }

  protected savePassword(): void {
    if (this.passwordForm.invalid) return;
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    const request$ = this.usersService.changePassword(this.orgId(), this.user().id, {
      oldPassword,
      password: newPassword,
    });
    this.passwordStatus.run(request$, () => this.passwordForm.reset());
  }
}
