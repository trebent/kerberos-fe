import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/auth/auth.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-profile',
  template: `
    <section class="profile-section">
      <h3>Profile</h3>

      <p class="profile-info">
        <mat-icon class="profile-icon">account_circle</mat-icon>
        <span>{{ authService.isSuperuser() ? 'Superuser' : authService.username() }}</span>
      </p>

      @if (!authService.isSuperuser()) {
        <h4>Change Username</h4>

        @if (usernameErrors().length) {
          <app-error-display [errors]="usernameErrors()" />
        }
        @if (usernameSuccess()) {
          <p class="success-message">Username updated successfully.</p>
        }

        <form [formGroup]="usernameForm" (ngSubmit)="submitUsername()">
          <mat-form-field appearance="outline">
            <mat-label>New username</mat-label>
            <input matInput formControlName="newUsername" autocomplete="username" />
          </mat-form-field>

          <button mat-flat-button type="submit" [disabled]="usernameForm.invalid">
            Update username
          </button>
        </form>
      }

      <h4>Change Password</h4>

      @if (passwordErrors().length) {
        <app-error-display [errors]="passwordErrors()" />
      }
      @if (passwordSuccess()) {
        <p class="success-message">Password changed successfully.</p>
      }

      <form [formGroup]="passwordForm" (ngSubmit)="submitPassword()">
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

        <button mat-flat-button type="submit" [disabled]="passwordForm.invalid">
          Change password
        </button>
      </form>
    </section>
  `,
  styles: [`
    .profile-section {
      margin-bottom: 32px;
    }
    .profile-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-body-large);
      margin-bottom: 16px;
    }
    .profile-icon {
      color: var(--mat-sys-primary);
    }
    form {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      margin-bottom: 16px;
    }
    mat-form-field {
      width: 320px;
    }
    .success-message {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-body-medium);
      margin-bottom: 8px;
    }
  `],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ErrorDisplayComponent,
  ],
})
export class ProfileComponent {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly usernameErrors = signal<string[]>([]);
  readonly usernameSuccess = signal(false);

  readonly passwordErrors = signal<string[]>([]);
  readonly passwordSuccess = signal(false);

  readonly usernameForm = this.fb.nonNullable.group({
    newUsername: ['', [Validators.required]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  submitUsername(): void {
    if (this.usernameForm.invalid) return;
    this.usernameErrors.set([]);
    this.usernameSuccess.set(false);
    const { newUsername } = this.usernameForm.getRawValue();

    this.authService.updateUsername(newUsername).subscribe({
      next: () => {
        this.usernameSuccess.set(true);
        this.usernameForm.reset();
      },
      error: () => {
        this.usernameErrors.set(['Failed to update username. Please try again.']);
      },
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) return;
    this.passwordErrors.set([]);
    this.passwordSuccess.set(false);
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();

    const change$ = this.authService.isSuperuser()
      ? this.authService.superChangePassword(newPassword, oldPassword)
      : this.authService.changePassword(this.authService.userID()!, newPassword, oldPassword);

    change$.subscribe({
      next: () => {
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
      },
      error: () => {
        this.passwordErrors.set(['Failed to change password. Please check your current password and try again.']);
      },
    });
  }
}
