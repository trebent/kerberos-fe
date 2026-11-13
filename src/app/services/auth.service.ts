import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { UsersService } from './admin';

const SESSION_EXPIRY_KEY = 'sessionExpiry';
const SESSION_SUPER_KEY = 'isSuper';

/** How long a session lives before it must be refreshed. */
const SESSION_TTL_MS = 15 * 60 * 1000;
/** How long after the session expires the refresh token is still accepted. */
const REFRESH_GRACE_MS = 45 * 60 * 1000;
/** How often an active session is refreshed. */
const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

/**
 * The single owner of the Kerberos admin session. Exposes the signed-in state as read-only
 * signals and keeps the session alive while the app is open.
 */
@Service()
export class AuthService {
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);

  private readonly _isSuperuser = signal(false);
  readonly isSuperuser = this._isSuperuser.asReadonly();

  private readonly _username = signal<string | null>(null);
  readonly username = this._username.asReadonly();

  private readonly _isLoggedIn = signal(false);
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  private readonly _userID = signal<number | null>(null);
  readonly userID = this._userID.asReadonly();

  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  /**
   * Restores the session on startup. If the refresh token is still valid the session is
   * refreshed and, for regular users, the current user is loaded. Never errors: a failed
   * restore simply leaves the user signed out.
   */
  init(): Observable<null> {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (expiry === null) {
      return of(null);
    }

    const expiryTime = parseInt(expiry, 10);
    if (isNaN(expiryTime) || Date.now() > expiryTime + REFRESH_GRACE_MS) {
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      return of(null);
    }

    const restore$ = this.storedIsSuper()
      ? this.usersService
          .refreshSuperuserSession()
          .pipe(tap(() => this.onLogin('superuser', 0, true)))
      : this.usersService.refreshUserSession().pipe(
          tap(() => this.onLogin('', 0, false)),
          switchMap(() => this.getMe()),
        );

    return restore$.pipe(
      map(() => null),
      catchError((error: unknown) => {
        console.error('Could not restore the session:', error);
        this.onLogout();
        return of(null);
      }),
    );
  }

  getMe(): Observable<null> {
    return this.usersService.getMe().pipe(
      tap((response) => {
        if (!response.isSuperuser && response.user) {
          this._userID.set(response.user.id);
          this._username.set(response.user.username);
        }
      }),
      map(() => null),
    );
  }

  login(username: string, password: string): Observable<null> {
    return this.usersService.login({ username, password }).pipe(
      tap(() => this.onLogin(username, 0, false)),
      // The login response has no user ID, so load the current user.
      switchMap(() => this.getMe()),
      // Without the current user the session is unusable, so don't leave it half signed in.
      catchError((error: unknown) => {
        this.onLogout();
        return throwError(() => error);
      }),
    );
  }

  logout(): Observable<null> {
    return this.usersService.logout().pipe(this.signOutLocally());
  }

  updateUsername(newUsername: string): Observable<null> {
    const userID = this._userID();
    if (userID === null) {
      return throwError(() => new Error('No user ID available'));
    }

    return this.usersService.updateUser(userID, { username: newUsername }).pipe(
      tap(() => this._username.set(newUsername)),
      map(() => null),
    );
  }

  superLogin(clientId: string, clientSecret: string): Observable<null> {
    return this.usersService
      .loginSuperuser({ clientId, clientSecret })
      .pipe(tap(() => this.onLogin('superuser', 0, true)));
  }

  superLogout(): Observable<null> {
    return this.usersService.logoutSuperuser().pipe(this.signOutLocally());
  }

  /** Changes the signed-in user's own password, through the superuser endpoint for the superuser. */
  changeOwnPassword(oldPassword: string, newPassword: string): Observable<null> {
    if (this._isSuperuser()) {
      return this.usersService.changeSuperuserPassword({ newPassword, oldPassword });
    }

    const userID = this._userID();
    if (userID === null) {
      return throwError(() => new Error('No user ID available'));
    }
    return this.usersService.changeUserPassword(userID, { newPassword, oldPassword });
  }

  /** Signs out locally whether or not the backend accepted the logout. */
  private signOutLocally() {
    return tap<null>({
      next: () => this.onLogout(),
      error: () => this.onLogout(),
    });
  }

  private onLogin(username: string, userID: number, isSuper: boolean): void {
    this.storeExpiry();
    localStorage.setItem(SESSION_SUPER_KEY, isSuper.toString());

    this._isLoggedIn.set(true);
    this._username.set(username);
    this._isSuperuser.set(isSuper);
    this._userID.set(userID);

    clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.refreshSession(), REFRESH_INTERVAL_MS);
  }

  private onLogout(): void {
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(SESSION_SUPER_KEY);

    this._isLoggedIn.set(false);
    this._username.set(null);
    this._isSuperuser.set(false);
    this._userID.set(null);

    clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
  }

  private refreshSession(): void {
    const refresh$ = this.storedIsSuper()
      ? this.usersService.refreshSuperuserSession()
      : this.usersService.refreshUserSession();

    refresh$.subscribe({
      next: () => this.storeExpiry(),
      error: () => {
        console.error('Failed to refresh the session.');
        this.onLogout();
        // The current page needs a session, so send the user back to log in.
        void this.router.navigateByUrl('/login');
      },
    });
  }

  private storeExpiry(): void {
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TTL_MS).toString());
  }

  private storedIsSuper(): boolean {
    return localStorage.getItem(SESSION_SUPER_KEY) === 'true';
  }
}
