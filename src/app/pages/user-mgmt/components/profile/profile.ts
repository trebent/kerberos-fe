import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';

import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { AuthService } from '../../../../services/auth.service';
import { requestStatus } from '../../../../utils/request-status';
import {
  PasswordMismatchStateMatcher,
  passwordsMatchValidator,
} from '../../../../utils/validation';

@Component({
  imports: [
    RequestFeedback,
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

  protected readonly usernameStatus = requestStatus({
    failure: 'Failed to update username. Please try again.',
    success: 'Username updated successfully.',
  });
  protected readonly passwordStatus = requestStatus({
    failure: 'Failed to change password. Please check your current password and try again.',
    success: 'Password changed successfully.',
  });

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
    const { newUsername } = this.usernameForm.getRawValue();
    this.usernameStatus.run(this.authService.updateUsername(newUsername), () =>
      this.usernameForm.reset(),
    );
  }

  protected submitPassword(): void {
    if (this.passwordForm.invalid) return;
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    const change$ = this.authService.isSuperuser()
      ? this.authService.superChangePassword(newPassword, oldPassword)
      : this.authService.changePassword(this.authService.userID()!, newPassword, oldPassword);
    this.passwordStatus.run(change$, () => this.passwordForm.reset());
  }
}
