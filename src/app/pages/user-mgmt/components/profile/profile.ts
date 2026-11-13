import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    PasswordChange,
    RequestFeedback,
    MatButton,
    MatDivider,
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

  protected readonly usernameStatus = requestStatus({
    failure: 'Failed to update username. Please try again.',
    success: 'Username updated successfully.',
  });

  protected readonly changePassword: ChangePassword = (oldPassword, newPassword) =>
    this.authService.changeOwnPassword(oldPassword, newPassword);

  protected readonly usernameForm = this.fb.nonNullable.group({
    newUsername: ['', [Validators.required]],
  });

  protected submitUsername(): void {
    if (this.usernameForm.invalid) return;
    const { newUsername } = this.usernameForm.getRawValue();
    this.usernameStatus.run(this.authService.updateUsername(newUsername), () =>
      this.usernameForm.reset(),
    );
  }
}
