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
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
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
