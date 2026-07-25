import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
    MatSlideToggleModule,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    superLogin: [false],
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  private authService = inject(AuthService);

  submit(): void {
    if (this.form.invalid) return;
    const { superLogin, username, password } = this.form.getRawValue();

    if (superLogin) {
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
