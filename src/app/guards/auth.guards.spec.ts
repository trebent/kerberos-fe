import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { createAuthStub, provideAuthStub } from '../../testing/auth-stub';
import { authGuard, guestGuard } from './auth.guards';

describe('auth guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/flow' } as RouterStateSnapshot),
    );

  function setUp(username?: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideAuthStub(createAuthStub({ username }))],
    });
  }

  it('authGuard sends guests to the login page', () => {
    setUp();
    expect((run(authGuard) as UrlTree).toString()).toBe('/login');
  });

  it('authGuard lets signed-in users through', () => {
    setUp('alice');
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard keeps signed-in users off the login page', () => {
    setUp('alice');
    expect((run(guestGuard) as UrlTree).toString()).toBe('/');
  });

  it('guestGuard lets guests through', () => {
    setUp();
    expect(run(guestGuard)).toBe(true);
  });
});
