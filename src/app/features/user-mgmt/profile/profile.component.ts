import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/auth/auth.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

class PasswordMismatchStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.invalid && control.touched) ||
      !!(form?.hasError('passwordsMismatch') && control?.touched);
  }
}

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
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    ErrorDisplayComponent,
  ],
})
export class ProfileComponent {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly mismatchMatcher = new PasswordMismatchStateMatcher();

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
        this.passwordForm.markAsUntouched();

        setTimeout(() => {
          this.passwordSuccess.set(false);
        }, 3000);
      },
      error: () => {
        this.passwordErrors.set(['Failed to change password. Please check your current password and try again.']);
      },
    });
  }
}
