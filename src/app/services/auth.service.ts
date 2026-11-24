import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { UsersService } from './admin';

const SESSION_EXPIRY_KEY = 'sessionExpiry';
const SESSION_SUPER_KEY = 'isSuper';
/** The superuser's name (client ID), kept to log in again after a password change. Not a secret. */
const SUPERUSER_CLIENT_ID_KEY = 'superuserClientId';

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

    const expiryTime = Number(expiry);
    if (Number.isNaN(expiryTime) || Date.now() > expiryTime + REFRESH_GRACE_MS) {
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      return of(null);
    }

    const restore$ = this.storedIsSuper()
      ? this.usersService.refreshSuperuserSession().pipe(tap(() => this.startSuperuserSession()))
      : this.usersService.refreshUserSession().pipe(
          tap(() => this.startSession(/* isSuper= */ false)),
          switchMap(() => this.loadCurrentUser()),
        );

    return restore$.pipe(
      map(() => null),
      catchError((error: unknown) => {
        console.error('Could not restore the session:', error);
        this.endSession();
        return of(null);
      }),
    );
  }

  login(username: string, password: string): Observable<null> {
    return this.usersService.login({ username, password }).pipe(
      tap(() => this.startSession(/* isSuper= */ false)),
      // The login response has no user ID, so load the current user.
      switchMap(() => this.loadCurrentUser()),
      // Without the current user the session is unusable, so don't leave it half signed in.
      catchError((error: unknown) => {
        this.endSession();
        return throwError(() => error);
      }),
    );
  }

  superLogin(clientId: string, clientSecret: string): Observable<null> {
    return this.usersService.loginSuperuser({ clientId, clientSecret }).pipe(
      tap(() => {
        this.startSuperuserSession();
        localStorage.setItem(SUPERUSER_CLIENT_ID_KEY, clientId);
      }),
    );
  }

  /**
   * Ends the session through the endpoint for the signed-in kind of user. Signs out locally
   * whether or not the backend accepted it, so it never errors.
   */
  logout(): Observable<null> {
    const logout$ = this._isSuperuser()
      ? this.usersService.logoutSuperuser()
      : this.usersService.logout();

    return logout$.pipe(
      catchError((error: unknown) => {
        console.error('The backend did not accept the logout:', error);
        return of(null);
      }),
      tap(() => this.endSession()),
    );
  }

  updateUsername(newUsername: string): Observable<null> {
    return this.withUserID((userID) =>
      this.usersService.updateUser(userID, { username: newUsername }),
    ).pipe(
      tap(() => this._username.set(newUsername)),
      map(() => null),
    );
  }

  /**
   * Changes the signed-in user's own password, through the superuser endpoint for the superuser,
   * then logs in again with the new password: Kerberos ends every session of a user whose
   * password changes, this one included.
   */
  changeOwnPassword(oldPassword: string, newPassword: string): Observable<null> {
    const change$ = this._isSuperuser()
      ? this.usersService.changeSuperuserPassword({ newPassword, oldPassword })
      : this.withUserID((userID) =>
          this.usersService.changeUserPassword(userID, { newPassword, oldPassword }),
        );
    return change$.pipe(switchMap(() => this.loginAgain(newPassword)));
  }

  /**
   * Logs in again after a password change ended the session. The change itself went through, so
   * this never errors: when the new login is not possible, it signs out to the login page.
   */
  private loginAgain(password: string): Observable<null> {
    const login$ = this._isSuperuser()
      ? this.superLoginAgain(password)
      : this.userLoginAgain(password);
    return login$.pipe(
      catchError((error: unknown) => {
        console.error('Could not log in again after the password change:', error);
        this.endSession();
        void this.router.navigateByUrl('/login');
        return of(null);
      }),
    );
  }

  private userLoginAgain(password: string): Observable<null> {
    const username = this._username();
    return username === null
      ? throwError(() => new Error('No username available'))
      : this.login(username, password);
  }

  /** Sessions started before the client ID was stored have none, so they sign in by hand. */
  private superLoginAgain(password: string): Observable<null> {
    const clientId = localStorage.getItem(SUPERUSER_CLIENT_ID_KEY);
    return clientId === null
      ? throwError(() => new Error('No superuser client ID stored'))
      : this.superLogin(clientId, password);
  }

  /** Loads the signed-in regular user's ID and name. */
  private loadCurrentUser(): Observable<null> {
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

  /** Runs a request for the signed-in user, or fails if their ID has not been loaded. */
  private withUserID<T>(request: (userID: number) => Observable<T>): Observable<T> {
    const userID = this._userID();
    return userID === null ? throwError(() => new Error('No user ID available')) : request(userID);
  }

  /** The superuser has no user record, so the name is fixed. */
  private startSuperuserSession(): void {
    this.startSession(/* isSuper= */ true);
    this._username.set('superuser');
  }

  private startSession(isSuper: boolean): void {
    this.storeExpiry();
    localStorage.setItem(SESSION_SUPER_KEY, isSuper.toString());

    this._isLoggedIn.set(true);
    this._isSuperuser.set(isSuper);

    clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.refreshSession(), REFRESH_INTERVAL_MS);
  }

  private endSession(): void {
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(SESSION_SUPER_KEY);
    localStorage.removeItem(SUPERUSER_CLIENT_ID_KEY);

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
        this.endSession();
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
