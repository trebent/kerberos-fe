import { Component, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required, validate } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable } from 'rxjs';

import { requestStatus } from '../../utils/request-status';
import { RequestFeedback } from '../request-feedback/request-feedback';

/** Sends a password change; the caller decides whose password and which endpoint. */
export type ChangePassword = (oldPassword: string, newPassword: string) => Observable<unknown>;

const EMPTY = { oldPassword: '', newPassword: '', confirmPassword: '' };

/** A current/new/confirm password form that reports how the change went. */
@Component({
  imports: [
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    FormField,
    FormRoot,
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

  protected readonly form = form(
    signal(EMPTY),
    (path) => {
      required(path.oldPassword);
      required(path.newPassword);
      required(path.confirmPassword);
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() === valueOf(path.newPassword) ? undefined : { kind: 'mismatch' },
      );
    },
    { submission: { action: async () => this.submit() } },
  );

  private submit(): void {
    const { oldPassword, newPassword } = this.form().value();
    this.status.run(this.change()(oldPassword, newPassword), () => this.form().reset(EMPTY));
  }
}
