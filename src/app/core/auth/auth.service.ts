import { Injectable, inject, signal } from '@angular/core';
import { UsersService } from '../../api/admin/api/users.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UsersService);

  private readonly _username = signal<string | null>(null);
  readonly username = this._username.asReadonly();

  private readonly _isLoggedIn = signal(false);
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  login(username: string, password: string): Observable<any> {
    return this.userService.login({ username, password }).pipe(
      tap({
        next: () => {
          this._username.set(username);
          this._isLoggedIn.set(true);
        },
        error: () => console.error('Login failed'),
      })
    );
  }

  logout(): Observable<any> {
    return this.userService.logout().pipe(
      tap({
        next: () => {
          this._isLoggedIn.set(false);
          this._username.set(null);
        },
        error: () => console.error('Logout failed'),
      })
    );
  }
}
