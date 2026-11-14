import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  const expectRequest = (path: string) => http.expectOne((req) => req.url.endsWith(path));
  const serverError = { status: 500, statusText: 'Server Error' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('signs in and loads the current user', () => {
    auth.login('alice', 'secret').subscribe();
    expectRequest('/api/admin/login').flush(null);
    expectRequest('/api/admin/me').flush({
      isSuperuser: false,
      user: { id: 4, username: 'alice' },
    });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.userID()).toBe(4);
    expect(auth.username()).toBe('alice');
  });

  it('stays signed out when the current user cannot be loaded after signing in', () => {
    const error = vi.fn();
    auth.login('alice', 'secret').subscribe({ error });
    expectRequest('/api/admin/login').flush(null);
    expectRequest('/api/admin/me').flush(null, serverError);

    expect(error).toHaveBeenCalled();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('sessionExpiry')).toBeNull();
  });

  it('signs a user out through the user endpoint', () => {
    auth.login('alice', 'secret').subscribe();
    expectRequest('/api/admin/login').flush(null);
    expectRequest('/api/admin/me').flush({
      isSuperuser: false,
      user: { id: 4, username: 'alice' },
    });

    auth.logout().subscribe();
    expectRequest('/api/admin/logout').flush(null);

    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.username()).toBeNull();
  });

  it('signs a superuser out locally even when the backend rejects the logout', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.superLogin('admin', 'secret').subscribe();
    expectRequest('/api/admin/superuser/login').flush(null);
    expect(auth.isSuperuser()).toBe(true);
    expect(auth.username()).toBe('superuser');

    const signedOut = vi.fn();
    auth.logout().subscribe(signedOut);
    expectRequest('/api/admin/superuser/logout').flush(null, serverError);

    expect(signedOut).toHaveBeenCalled();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.isSuperuser()).toBe(false);
  });

  it('sends the user to log in when the session can no longer be refreshed', () => {
    vi.useFakeTimers();
    auth.superLogin('admin', 'secret').subscribe();
    expectRequest('/api/admin/superuser/login').flush(null);

    vi.advanceTimersByTime(2 * 60 * 1000);
    expectRequest('/api/admin/superuser/refresh').flush(null, { status: 401, statusText: 'No' });

    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it("changes the signed-in user's own password", () => {
    auth.login('alice', 'secret').subscribe();
    expectRequest('/api/admin/login').flush(null);
    expectRequest('/api/admin/me').flush({
      isSuperuser: false,
      user: { id: 4, username: 'alice' },
    });

    auth.changeOwnPassword('old', 'new').subscribe();
    const request = expectRequest('/api/admin/users/4/password');
    expect(request.request.body).toEqual({ oldPassword: 'old', newPassword: 'new' });
    request.flush(null);
  });

  it("changes the superuser's password through the superuser endpoint", () => {
    auth.superLogin('admin', 'secret').subscribe();
    expectRequest('/api/admin/superuser/login').flush(null);

    auth.changeOwnPassword('old', 'new').subscribe();
    expectRequest('/api/admin/superuser/password').flush(null);
  });
});
