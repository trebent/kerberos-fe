import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';

import { RequestFeedback } from '../../components/request-feedback/request-feedback';
import { AuthService } from '../../services/auth.service';
import { requestStatus } from '../../utils/request-status';

@Component({
  imports: [
    FormField,
    FormRoot,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatSlideToggle,
    RequestFeedback,
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

  protected readonly form = form(
    signal({ superLogin: false, username: '', password: '' }),
    (path) => {
      required(path.username);
      required(path.password);
    },
    { submission: { action: async () => this.signIn() } },
  );

  private signIn(): void {
    if (this.signInStatus.pending()) return;
    const { superLogin, username, password } = this.form().value();
    const login$ = superLogin
      ? this.auth.superLogin(username, password)
      : this.auth.login(username, password);
    this.signInStatus.run(login$, () => void this.router.navigateByUrl('/'));
  }
}
