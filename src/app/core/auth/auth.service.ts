import { Injectable, inject, signal } from '@angular/core';
import { UsersService } from '../../api/admin/api/users.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UsersService);

  private readonly _isSuperuser = signal(false);
  readonly isSuperuser = this._isSuperuser.asReadonly();

  private readonly _username = signal<string | null>(null);
  readonly username = this._username.asReadonly();

  private readonly _isLoggedIn = signal(false);
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  private readonly _userID = signal<number | null>(null);
  readonly userID = this._userID.asReadonly();

  /**
   * Calls GET /api/admin/me to hydrate auth state from an existing session.
   * Always completes without error — 401 clears state, other errors are logged and swallowed.
   */
  checkSession(): Observable<null> {
    return this.userService.getMe().pipe(
      tap((response) => {
        if (response.isSuperuser) {
          this._isLoggedIn.set(true);
          this._isSuperuser.set(true);
          this._username.set('superuser');
        } else if (response.user) {
          this._isLoggedIn.set(true);
          this._isSuperuser.set(false);
          this._username.set(response.user.username);
          this._userID.set(response.user.id);
        }
      }),
      map(() => null as null),
      catchError((err) => {
        if (err?.status !== 401) {
          console.error('Session check failed', err);
        }
        return of(null);
      }),
    );
  }

  login(username: string, password: string): Observable<null> {
    return this.userService.login({ username, password }).pipe(
      tap({ error: () => console.error('Login failed') }),
      switchMap(() => this.checkSession()),
    );
  }

  logout(): Observable<null> {
    return this.userService.logout().pipe(
      tap({
        next: () => {
          this._isLoggedIn.set(false);
          this._username.set(null);
          this._userID.set(null);
        },
        error: () => console.error('Logout failed'),
      })
    );
  }

  updateUsername(newUsername: string): Observable<null> {
    const userID = this._userID();
    if (userID === null) {
      return new Observable(observer => { observer.error(new Error('No user ID available')); });
    }
    return this.userService.updateUser(userID, { username: newUsername }).pipe(
      tap({
        next: () => {
          this._username.set(newUsername);
        },
        error: () => console.error('Username update failed'),
      }),
      map(() => null as null),
    );
  }

  changePassword(userID: number, newPassword: string, oldPassword: string): Observable<null> {
    return this.userService.changeUserPassword(userID, { newPassword, oldPassword }).pipe(
      tap({
        next: () => {
          console.log('Password changed successfully');
        },
        error: () => console.error('Password change failed'),
      })
    );
  }

  superLogin(clientId: string, clientSecret: string): Observable<null> {
    return this.userService.loginSuperuser({ clientId, clientSecret }).pipe(
      tap({
        next: () => {
          this._username.set("superuser");
          this._isLoggedIn.set(true);
          this._isSuperuser.set(true);
        },
        error: () => console.error('Login failed'),
      })
    );
  }

  superLogout(): Observable<null> {
    return this.userService.logoutSuperuser().pipe(
      tap({
        next: () => {
          this._isLoggedIn.set(false);
          this._username.set(null);
          this._isSuperuser.set(false);
          this._userID.set(null);
        },
        error: () => console.error('Logout failed'),
      })
    );
  }

  superChangePassword(newPassword: string, oldPassword: string): Observable<null> {
    return this.userService.changeSuperuserPassword({ newPassword, oldPassword }).pipe(
      tap({
        next: () => {
          console.log('Password changed successfully');
        },
        error: () => console.error('Password change failed'),
      })
    );
  }
}
