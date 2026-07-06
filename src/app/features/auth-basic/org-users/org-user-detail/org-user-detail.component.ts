import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { GroupsService } from '../../../../api/auth-basic/api/groups.service';
import { UsersService } from '../../../../api/auth-basic/api/users.service';
import { User } from '../../../../api/auth-basic/model/user';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPass = control.get('newPassword')?.value;
  const confirmPass = control.get('confirmPassword')?.value;
  return newPass === confirmPass ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-org-user-detail',
  template: `
    <section class="detail-section">
      <h4>Edit User</h4>

      <h5>Name</h5>
      @if (nameErrors().length) {
        <app-error-display [errors]="nameErrors()" />
      }
      @if (nameSuccess()) {
        <p class="success-message">Name updated successfully.</p>
      }
      <form [formGroup]="nameForm" (ngSubmit)="saveName()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" autocomplete="username" />
        </mat-form-field>
        <div class="form-actions">
          <button mat-flat-button type="submit" [disabled]="nameForm.invalid">Save name</button>
          <button mat-button type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>

      <h5>Groups</h5>
      @if (groupsLoading()) {
        <mat-spinner diameter="24" />
      }
      @if (groupErrors().length) {
        <app-error-display [errors]="groupErrors()" />
      }
      @if (groupSuccess()) {
        <p class="success-message">Groups updated successfully.</p>
      }
      @if (!groupsLoading() && availableGroups().length) {
        <fieldset class="groups-fieldset">
          <legend>Select groups</legend>
          @for (g of availableGroups(); track g) {
            <mat-checkbox [checked]="selectedGroups().includes(g)" (change)="toggleGroup(g)">
              {{ g }}
            </mat-checkbox>
          }
        </fieldset>
        <div class="form-actions">
          <button mat-flat-button type="button" (click)="saveGroups()">Save groups</button>
        </div>
      }

      <h5>Change Password</h5>
      @if (passwordErrors().length) {
        <app-error-display [errors]="passwordErrors()" />
      }
      @if (passwordSuccess()) {
        <p class="success-message">Password changed successfully.</p>
      }
      <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
        <mat-form-field appearance="outline">
          <mat-label>Current password</mat-label>
          <input matInput type="password" formControlName="oldPassword" autocomplete="current-password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>New password</mat-label>
          <input matInput type="password" formControlName="newPassword" autocomplete="new-password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Confirm new password</mat-label>
          <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
          @if (passwordForm.hasError('passwordsMismatch') && passwordForm.get('confirmPassword')?.touched) {
            <mat-error>Passwords do not match.</mat-error>
          }
        </mat-form-field>
        <div class="form-actions">
          <button mat-flat-button type="submit" [disabled]="passwordForm.invalid">Change password</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .detail-section {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
    }
    h4 {
      margin: 0 0 12px;
    }
    h5 {
      margin: 16px 0 8px;
      font: var(--mat-sys-label-large);
    }
    form {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      margin-bottom: 8px;
    }
    mat-form-field {
      width: 320px;
    }
    .groups-fieldset {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 4px;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }
    .groups-fieldset legend {
      font: var(--mat-sys-label-medium);
      padding: 0 4px;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .success-message {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-body-medium);
      margin-bottom: 8px;
    }
  `],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
  ],
})
export class OrgUserDetailComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number>();
  readonly user = input.required<User>();

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly nameErrors = signal<string[]>([]);
  readonly nameSuccess = signal(false);

  readonly groupsLoading = signal(false);
  readonly availableGroups = signal<string[]>([]);
  readonly selectedGroups = signal<string[]>([]);
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

  ngOnInit(): void {
    this.nameForm.reset({ name: this.user().name });
    this.loadGroups();
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
        this.availableGroups.set(groups.map(g => g.name));
        this.selectedGroups.set(userGroups);
        this.groupsLoading.set(false);
      },
      error: () => {
        this.groupErrors.set(['Failed to load groups.']);
        this.groupsLoading.set(false);
      },
    });
  }

  toggleGroup(groupName: string): void {
    const current = this.selectedGroups();
    if (current.includes(groupName)) {
      this.selectedGroups.set(current.filter(n => n !== groupName));
    } else {
      this.selectedGroups.set([...current, groupName]);
    }
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
        this.saved.emit();
      },
      error: () => this.nameErrors.set(['Failed to update name. Please try again.']),
    });
  }

  saveGroups(): void {
    this.groupErrors.set([]);
    this.groupSuccess.set(false);
    this.usersService.updateUserGroups(this.orgId(), this.user().id, this.selectedGroups()).subscribe({
      next: () => this.groupSuccess.set(true),
      error: () => this.groupErrors.set(['Failed to update groups. Please try again.']),
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    this.passwordErrors.set([]);
    this.passwordSuccess.set(false);
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    this.usersService.changePassword(this.orgId(), this.user().id, { oldPassword, password: newPassword }).subscribe({
      next: () => {
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
      },
      error: () => this.passwordErrors.set(['Failed to change password. Please check your current password and try again.']),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
