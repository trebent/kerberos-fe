import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly superLogin = signal(false);

  @HostListener('document:keydown.control.m', ['$event'])
  onSuperLoginToggle(event: Event): void {
    event.preventDefault();
    this.superLogin.update(v => !v);
  }

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  private authService = inject(AuthService);

  submit(): void {
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();

    if (this.superLogin()) {
      this.authService.superLogin(username, password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: Error) => {
          console.error(error);
        },
      });
    } else {
      this.authService.login(username, password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: Error) => {
          console.error(error);
        },
      });
    }
  }
}
