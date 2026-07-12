import { Injectable, inject, signal } from '@angular/core';
import { UsersService } from '../../api/admin/api/users.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';


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

  private refreshTimerRef: number | undefined = undefined;
  private readonly sessionExpiryLocalStorageKey = 'sessionExpiry';
  private readonly sessionSuperLocalStorageKey = 'isSuper';

  /**
   * Initializes the authentication service. This method should be called during application startup 
   * to check the current session and set the authentication state accordingly.
   * 
   * This will, in order:
   * 1. Check if the session's refresh token has expired
   *    a. If no, refresh the session.
   *    b. If yes, do nothing.
   * 2. With a valid session, fetch the current user information and update the authentication state (getMe).
   * 
   * @returns An Observable that completes when the initialization process is done.
   */
  init(): Observable<null> {
    const expiry = localStorage.getItem(this.sessionExpiryLocalStorageKey);
    if (expiry === null) {
      console.debug('No session expiry found in local storage. Assuming no active session.');
      return of(null);
    }

    const expiryTime = parseInt(expiry, 10);
    if (isNaN(expiryTime)) {
      console.error('Invalid session expiry time in local storage. Clearing it.');
      localStorage.removeItem(this.sessionExpiryLocalStorageKey);
      return of(null);
    }

    if (Date.now() > (expiryTime + 45 * 60 * 1000)) {
      console.debug('Session has expired and refresh token is also expired. Clearing session.');
      localStorage.removeItem(this.sessionExpiryLocalStorageKey);
      return of(null);
    }

    console.debug('Refresh token is valid, refreshing session.');

    const isSuper = localStorage.getItem(this.sessionSuperLocalStorageKey) === 'true';

    if (isSuper) {
      return this.userService.refreshSuperuserSession().pipe(
        tap({
          next: () => {
            console.debug('Superuser session refreshed successfully.');
            this.onLogin('superuser', 0, true);
          },
          error: () => {
            console.error('Failed to refresh superuser session.');
            this.onLogout();
          },
        }),
        map(() => {
          return null as null;
        }),
      );
    } else {
      return this.userService.refreshUserSession().pipe(
        tap({
          next: () => {
            console.debug('User session refreshed successfully.');
            this.onLogin('', 0, false);
          },
          error: () => {
            console.error('Failed to refresh user session.');
            this.onLogout();
          },
        }),
        switchMap(() => this.getMe())
      );
    }
  }

  getMe(): Observable<null> {
    return this.userService.getMe().pipe(
      tap((response) => {
        if (!response.isSuperuser) {
          this._userID.set(response.user!.id);
          this._username.set(response.user!.username);
        }
      }),
      // Force null return type for consistency with other methods
      map(() => {
        return null as null;
      }),
    );
  }

  login(username: string, password: string): Observable<null> {
    return this.userService.login({ username, password }).pipe(
      tap({
        next: () => this.onLogin(username, 0, false),
        error: () => console.error('Login failed')
      }
      ),
      // Get self after login to get the user ID.
      switchMap(() => this.getMe()),
    );
  }

  logout(): Observable<null> {
    return this.userService.logout().pipe(
      tap({
        next: () => this.onLogout(),
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
        next: () => this._username.set(newUsername),
        error: () => console.error('Username update failed'),
      }),
      map(() => null as null),
    );
  }

  changePassword(userID: number, newPassword: string, oldPassword: string): Observable<null> {
    return this.userService.changeUserPassword(userID, { newPassword, oldPassword }).pipe(
      tap({
        error: () => console.error('Password change failed'),
      })
    );
  }

  superLogin(clientId: string, clientSecret: string): Observable<null> {
    return this.userService.loginSuperuser({ clientId, clientSecret }).pipe(
      tap({
        next: () => this.onLogin('superuser', 0, true),
        error: () => console.error('Login failed'),
      })
    );
  }

  superLogout(): Observable<null> {
    return this.userService.logoutSuperuser().pipe(
      tap({
        next: () => this.onLogout(),
        error: () => console.error('Logout failed'),
      })
    );
  }

  superChangePassword(newPassword: string, oldPassword: string): Observable<null> {
    return this.userService.changeSuperuserPassword({ newPassword, oldPassword }).pipe(
      tap({
        error: () => console.error('Password change failed'),
      })
    );
  }

  onLogin(username: string, userID: number, isSuper: boolean): void {
    localStorage.setItem(this.sessionExpiryLocalStorageKey, (Date.now() + 15 * 60 * 1000).toString());
    localStorage.setItem(this.sessionSuperLocalStorageKey, isSuper.toString());

    this._isLoggedIn.set(true);
    this._username.set(username);
    this._isSuperuser.set(isSuper);
    this._userID.set(userID);

    this.refreshTimerRef = setInterval(this.refreshSession.bind(this), 2 * 60 * 1000); // Refresh every 2 minutes
  }

  onLogout(): void {
    localStorage.removeItem(this.sessionExpiryLocalStorageKey);
    localStorage.removeItem(this.sessionSuperLocalStorageKey);

    this._isLoggedIn.set(false);
    this._username.set(null);
    this._isSuperuser.set(false);
    this._userID.set(null);

    clearInterval(this.refreshTimerRef);
    this.refreshTimerRef = undefined;
  }

  refreshSession(): void {
    console.debug('Refreshing session');
    const isSuper = localStorage.getItem(this.sessionSuperLocalStorageKey) === 'true';

    if (isSuper) {
      this.userService.refreshSuperuserSession().subscribe({
        next: () => {
          console.debug('Superuser session refreshed successfully.');
          localStorage.setItem(this.sessionExpiryLocalStorageKey, (Date.now() + 15 * 60 * 1000).toString());
        },
        error: () => {
          console.error('Failed to refresh superuser session.');
          this.onLogout();
        },
      });
    } else {
      this.userService.refreshUserSession().subscribe({
        next: () => {
          console.debug('User session refreshed successfully.');
          localStorage.setItem(this.sessionExpiryLocalStorageKey, (Date.now() + 15 * 60 * 1000).toString());
        },
        error: () => {
          console.error('Failed to refresh user session.');
          this.onLogout();
        },
      });
    }
  }
}
