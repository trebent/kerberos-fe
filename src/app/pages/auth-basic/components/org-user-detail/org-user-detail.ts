import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, GroupsService, User, UsersService } from '../../../../services/auth-basic';
import { IdSelection } from '../../../../utils/id-selection';
import {
  PasswordMismatchStateMatcher,
  passwordsMatchValidator,
} from '../../../../utils/validation';

@Component({
  imports: [
    EditPanel,
    ErrorDisplay,
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

  readonly closed = output<void>();
  readonly dataChanged = output<void>();

  protected readonly nameErrors = signal<string[]>([]);
  protected readonly nameSuccess = signal(false);

  protected readonly groupsLoading = signal(false);
  protected readonly availableGroups = signal<Group[]>([]);
  protected readonly selectedGroups = new IdSelection();
  protected readonly groupErrors = signal<string[]>([]);
  protected readonly groupSuccess = signal(false);

  protected readonly passwordErrors = signal<string[]>([]);
  protected readonly passwordSuccess = signal(false);

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
    effect(() => {
      this.nameForm.reset({ name: this.user().name });
      this.loadGroups();
    });
  }

  private loadGroups(): void {
    this.groupsLoading.set(true);
    const orgId = this.orgId();
    const userId = this.user().id;
    forkJoin([
      this.groupsService.listGroups(orgId),
      this.usersService.getUserGroups(orgId, userId),
    ]).subscribe({
      next: ([groups, userGroups]) => {
        this.availableGroups.set(groups);
        this.selectedGroups.set(userGroups.map((g) => g.id));
        this.groupsLoading.set(false);
      },
      error: () => {
        this.groupErrors.set(['Failed to load groups.']);
        this.groupsLoading.set(false);
      },
    });
  }

  protected saveName(): void {
    if (this.nameForm.invalid) return;
    this.nameErrors.set([]);
    this.nameSuccess.set(false);
    const { name } = this.nameForm.getRawValue();
    const u = this.user();
    this.usersService.updateUser(this.orgId(), u.id, { id: u.id, name }).subscribe({
      next: () => {
        this.nameSuccess.set(true);
        this.dataChanged.emit();

        setTimeout(() => {
          this.nameSuccess.set(false);
        }, 2000);
      },
      error: () => this.nameErrors.set(['Failed to update name. Please try again.']),
    });
  }

  protected saveGroups(): void {
    this.groupErrors.set([]);
    this.groupSuccess.set(false);
    const groups = this.availableGroups().filter((g) => this.selectedGroups.has(g.id));
    this.usersService.updateUserGroups(this.orgId(), this.user().id, groups).subscribe({
      next: () => {
        this.groupSuccess.set(true);
        this.dataChanged.emit();

        setTimeout(() => {
          this.groupSuccess.set(false);
        }, 2000);
      },
      error: () => this.groupErrors.set(['Failed to update groups. Please try again.']),
    });
  }

  protected savePassword(): void {
    if (this.passwordForm.invalid) return;
    this.passwordErrors.set([]);
    this.passwordSuccess.set(false);
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    this.usersService
      .changePassword(this.orgId(), this.user().id, { oldPassword, password: newPassword })
      .subscribe({
        next: () => {
          this.passwordSuccess.set(true);
          this.passwordForm.reset();

          setTimeout(() => {
            this.passwordSuccess.set(false);
          }, 2000);
        },
        error: () =>
          this.passwordErrors.set([
            'Failed to change password. Please check your current password and try again.',
          ]),
      });
  }
}
