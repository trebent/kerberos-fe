import { Injectable, signal, computed } from '@angular/core';

const SESSION_KEY = 'krb-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _sessionId = signal<string | null>(
    sessionStorage.getItem(SESSION_KEY)
  );

  readonly sessionId = this._sessionId.asReadonly();
  readonly isAuthenticated = computed(() => this._sessionId() !== null);

  setSession(sessionId: string): void {
    this._sessionId.set(sessionId);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  clearSession(): void {
    this._sessionId.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }
}
