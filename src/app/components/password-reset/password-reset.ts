import { Component, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable } from 'rxjs';

import { newPasswordRules } from '../../utils/password-rules';
import { requestStatus } from '../../utils/request-status';
import { RequestFeedback } from '../request-feedback/request-feedback';

/** Sets a new password without the old one; the caller decides whose password and which endpoint. */
export type ResetPassword = (newPassword: string) => Observable<unknown>;

const EMPTY = { newPassword: '', confirmPassword: '' };

/**
 * A new/confirm password form for an administrator who resets someone else's password. Kerberos
 * ends all of that user's sessions, so the form says so next to the button.
 */
@Component({
  imports: [
    MatButton,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    FormField,
    FormRoot,
    RequestFeedback,
  ],
  selector: 'app-password-reset',
  styleUrl: './password-reset.scss',
  templateUrl: './password-reset.html',
})
export class PasswordReset {
  readonly reset = input.required<ResetPassword>();

  protected readonly status = requestStatus({
    failure: 'Failed to reset the password. Please try again.',
    success: 'Password reset. The user has been logged out everywhere.',
  });

  protected readonly form = form(
    signal(EMPTY),
    (path) => {
      newPasswordRules(path.newPassword);
      required(path.confirmPassword);
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() === valueOf(path.newPassword) ? undefined : { kind: 'mismatch' },
      );
    },
    { submission: { action: async () => this.submit() } },
  );

  private submit(): void {
    const { newPassword } = this.form().value();
    this.status.run(this.reset()(newPassword), () => this.form().reset(EMPTY));
  }
}
