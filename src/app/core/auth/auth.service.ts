import { Injectable, signal, computed } from '@angular/core';

const SESSION_KEY = 'krb-session';
const USERNAME_KEY = 'krb-username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _sessionId = signal<string | null>(
    sessionStorage.getItem(SESSION_KEY)
  );
  private readonly _username = signal<string | null>(
    sessionStorage.getItem(USERNAME_KEY)
  );

  readonly sessionId = this._sessionId.asReadonly();
  readonly username = this._username.asReadonly();
  readonly isAuthenticated = computed(() => this._sessionId() !== null);

  setSession(sessionId: string, username: string): void {
    this._sessionId.set(sessionId);
    this._username.set(username);
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(USERNAME_KEY, username);
  }

  clearSession(): void {
    this._sessionId.set(null);
    this._username.set(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
  }
}
