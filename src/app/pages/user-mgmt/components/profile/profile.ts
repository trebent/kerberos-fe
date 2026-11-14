import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';

import {
  ChangePassword,
  PasswordChange,
} from '../../../../components/password-change/password-change';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { AuthService } from '../../../../services/auth.service';
import { requestStatus } from '../../../../utils/request-status';

@Component({
  host: { class: 'section-card' },
  imports: [
    FormField,
    FormRoot,
    MatButton,
    MatDivider,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    PasswordChange,
    RequestFeedback,
  ],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly authService = inject(AuthService);

  protected readonly usernameStatus = requestStatus({
    failure: 'Failed to update username. Please try again.',
    success: 'Username updated successfully.',
  });

  protected readonly changePassword: ChangePassword = (oldPassword, newPassword) =>
    this.authService.changeOwnPassword(oldPassword, newPassword);

  protected readonly usernameForm = form(
    signal({ newUsername: '' }),
    (path) => required(path.newUsername),
    { submission: { action: async () => this.updateUsername() } },
  );

  private updateUsername(): void {
    const { newUsername } = this.usernameForm().value();
    this.usernameStatus.run(this.authService.updateUsername(newUsername), () =>
      this.usernameForm().reset({ newUsername: '' }),
    );
  }
}
