import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { RequestFeedback } from '../../components/request-feedback/request-feedback';
import { AuthService } from '../../services/auth.service';
import { requestStatus } from '../../utils/request-status';

@Component({
  imports: [
    RequestFeedback,
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

  protected readonly signInStatus = requestStatus({
    failure: 'Could not sign in. Check your credentials and try again.',
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    superLogin: [false],
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.signInStatus.pending()) return;

    const { superLogin, username, password } = this.form.getRawValue();
    const login$: Observable<null> = superLogin
      ? this.auth.superLogin(username, password)
      : this.auth.login(username, password);

    this.signInStatus.run(login$, () => void this.router.navigateByUrl('/'));
  }
}
