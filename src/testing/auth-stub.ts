import { Provider, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AuthService } from '../app/services/auth.service';

const done = (): Observable<null> => of(null);

/** A controllable stand-in for AuthService, so specs don't need HTTP. */
export function createAuthStub(options: { username?: string; isSuperuser?: boolean } = {}) {
  const username = signal<string | null>(options.username ?? null);
  const isLoggedIn = signal(options.username !== undefined);
  const isSuperuser = signal(options.isSuperuser ?? false);
  const userID = signal<number | null>(options.username !== undefined ? 1 : null);

  return {
    username: username.asReadonly(),
    isLoggedIn: isLoggedIn.asReadonly(),
    isSuperuser: isSuperuser.asReadonly(),
    userID: userID.asReadonly(),
    signIn: (name: string, superuser = false) => {
      username.set(name);
      isSuperuser.set(superuser);
      userID.set(1);
      isLoggedIn.set(true);
    },
    init: vi.fn(done),
    login: vi.fn(done),
    logout: vi.fn(done),
    superLogin: vi.fn(done),
    superLogout: vi.fn(done),
    updateUsername: vi.fn(done),
    changePassword: vi.fn(done),
    superChangePassword: vi.fn(done),
  };
}

export type AuthStub = ReturnType<typeof createAuthStub>;

export function provideAuthStub(stub: AuthStub): Provider {
  return { provide: AuthService, useValue: stub };
}
