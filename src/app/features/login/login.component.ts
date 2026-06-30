import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { UsersService } from '../../api/admin/api/users.service';
import { CreateUserRequest } from '../../api/admin/model/create-user-request';
import { HttpResponse } from '@angular/common/http';

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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  private adminService = inject(UsersService);

  submit(): void {
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();

    this.adminService.login({ username: username, password: password }, 'response').subscribe({
      next: (response: HttpResponse<any>) => {
        console.debug(response)
        const sessionID = response.headers.get("x-krb-session")
        if (sessionID == null) {
          console.error("No session ID returned from server");
        } else {
          this.auth.setSession(sessionID, username);
          this.router.navigate(['/']);
        }
      },
      error: (error: Error) => {
        console.error(error);
      },
      complete: () => {
        console.log('Login request completed');
      }
    });

  }
}
