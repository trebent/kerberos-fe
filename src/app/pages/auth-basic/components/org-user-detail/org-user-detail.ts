import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, GroupsService, User, UsersService } from '../../../../services/auth-basic';
import {
  PasswordMismatchStateMatcher,
  passwordsMatchValidator,
} from '../../../../utils/validation';

@Component({
  host: { class: 'section-card edit-panel' },
  imports: [
    ErrorDisplay,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatIcon,
    MatIconButton,
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

  readonly mismatchMatcher = new PasswordMismatchStateMatcher();

  readonly orgId = input.required<number>();
  readonly user = input.required<User>();

  readonly closed = output<void>();
  readonly dataChanged = output<void>();

  readonly nameErrors = signal<string[]>([]);
  readonly nameSuccess = signal(false);

  readonly groupsLoading = signal(false);
  readonly availableGroups = signal<Group[]>([]);
  readonly selectedGroupIds = signal<Set<number>>(new Set());
  readonly groupErrors = signal<string[]>([]);
  readonly groupSuccess = signal(false);

  readonly passwordErrors = signal<string[]>([]);
  readonly passwordSuccess = signal(false);

  readonly nameForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly passwordForm = this.fb.nonNullable.group(
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
        this.selectedGroupIds.set(new Set(userGroups.map((g) => g.id)));
        this.groupsLoading.set(false);
      },
      error: () => {
        this.groupErrors.set(['Failed to load groups.']);
        this.groupsLoading.set(false);
      },
    });
  }

  toggleGroup(group: Group): void {
    const ids = new Set(this.selectedGroupIds());
    if (ids.has(group.id)) {
      ids.delete(group.id);
    } else {
      ids.add(group.id);
    }
    this.selectedGroupIds.set(ids);
  }

  saveName(): void {
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

  saveGroups(): void {
    this.groupErrors.set([]);
    this.groupSuccess.set(false);
    const groups = this.availableGroups().filter((g) => this.selectedGroupIds().has(g.id));
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

  savePassword(): void {
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

  close(): void {
    this.closed.emit();
  }
}
