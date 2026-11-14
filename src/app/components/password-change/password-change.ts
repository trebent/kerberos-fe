import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable } from 'rxjs';

import { requestStatus } from '../../utils/request-status';
import { PasswordMismatchStateMatcher, passwordsMatchValidator } from '../../utils/validation';
import { RequestFeedback } from '../request-feedback/request-feedback';

/** Sends a password change; the caller decides whose password and which endpoint. */
export type ChangePassword = (oldPassword: string, newPassword: string) => Observable<unknown>;

/** A current/new/confirm password form that reports how the change went. */
@Component({
  imports: [
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    RequestFeedback,
  ],
  selector: 'app-password-change',
  templateUrl: './password-change.html',
})
export class PasswordChange {
  readonly change = input.required<ChangePassword>();

  protected readonly status = requestStatus({
    failure: 'Failed to change password. Please check your current password and try again.',
    success: 'Password changed successfully.',
  });

  protected readonly mismatchMatcher = new PasswordMismatchStateMatcher();

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected submit(): void {
    if (this.form.invalid) return;
    const { oldPassword, newPassword } = this.form.getRawValue();
    this.status.run(this.change()(oldPassword, newPassword), () => this.form.reset());
  }
}
