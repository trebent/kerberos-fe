import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ErrorDisplay } from '../../components/error-display/error-display';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [
    ErrorDisplay,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatSlideToggle,
    ReactiveFormsModule,
  ],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly errors = signal<string[]>([]);
  protected readonly submitting = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    superLogin: [false],
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;

    const { superLogin, username, password } = this.form.getRawValue();
    const login$: Observable<null> = superLogin
      ? this.auth.superLogin(username, password)
      : this.auth.login(username, password);

    this.errors.set([]);
    this.submitting.set(true);
    login$.subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.submitting.set(false);
        this.errors.set(['Could not sign in. Check your credentials and try again.']);
      },
    });
  }
}
