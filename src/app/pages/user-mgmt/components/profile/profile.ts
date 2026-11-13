import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { AuthService } from '../../../../services/auth.service';
import {
  PasswordMismatchStateMatcher,
  passwordsMatchValidator,
} from '../../../../utils/validation';

@Component({
  host: { class: 'section-card' },
  imports: [
    ErrorDisplay,
    MatButton,
    MatDivider,
    MatError,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
  ],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly mismatchMatcher = new PasswordMismatchStateMatcher();

  protected readonly usernameErrors = signal<string[]>([]);
  protected readonly usernameSuccess = signal(false);

  protected readonly passwordErrors = signal<string[]>([]);
  protected readonly passwordSuccess = signal(false);

  protected readonly usernameForm = this.fb.nonNullable.group({
    newUsername: ['', [Validators.required]],
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected submitUsername(): void {
    if (this.usernameForm.invalid) return;

    this.usernameErrors.set([]);
    this.usernameSuccess.set(false);

    const { newUsername } = this.usernameForm.getRawValue();

    this.authService.updateUsername(newUsername).subscribe({
      next: () => {
        this.usernameSuccess.set(true);
        this.usernameForm.reset();
        this.usernameForm.markAsUntouched();

        setTimeout(() => {
          this.usernameSuccess.set(false);
        }, 3000);
      },
      error: () => {
        this.usernameErrors.set(['Failed to update username. Please try again.']);
      },
    });
  }

  protected submitPassword(): void {
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
        this.passwordForm.markAsUntouched();

        setTimeout(() => {
          this.passwordSuccess.set(false);
        }, 3000);
      },
      error: () => {
        this.passwordErrors.set([
          'Failed to change password. Please check your current password and try again.',
        ]);
      },
    });
  }
}
