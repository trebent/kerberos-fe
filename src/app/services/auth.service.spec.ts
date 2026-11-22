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

  it("changes the signed-in user's own password and logs in again with it", () => {
    auth.login('alice', 'secret').subscribe();
    expectRequest('/api/admin/login').flush(null);
    expectRequest('/api/admin/me').flush({
      isSuperuser: false,
      user: { id: 4, username: 'alice' },
    });

    const done = vi.fn();
    auth.changeOwnPassword('old', 'new').subscribe(done);
    const request = expectRequest('/api/admin/users/4/password');
    expect(request.request.body).toEqual({ oldPassword: 'old', newPassword: 'new' });
    request.flush(null);

    const login = expectRequest('/api/admin/login');
    expect(login.request.body).toEqual({ username: 'alice', password: 'new' });
    login.flush(null);
    expectRequest('/api/admin/me').flush({
      isSuperuser: false,
      user: { id: 4, username: 'alice' },
    });

    expect(done).toHaveBeenCalled();
    expect(auth.isLoggedIn()).toBe(true);
  });

  it("changes the superuser's password and logs in again with its client ID", () => {
    auth.superLogin('admin', 'secret').subscribe();
    expectRequest('/api/admin/superuser/login').flush(null);

    auth.changeOwnPassword('old', 'new').subscribe();
    expectRequest('/api/admin/superuser/password').flush(null);

    const login = expectRequest('/api/admin/superuser/login');
    expect(login.request.body).toEqual({ clientId: 'admin', clientSecret: 'new' });
    login.flush(null);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isSuperuser()).toBe(true);
  });

  it('sends the user to log in when logging in again after a password change fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.superLogin('admin', 'secret').subscribe();
    expectRequest('/api/admin/superuser/login').flush(null);

    const done = vi.fn();
    const error = vi.fn();
    auth.changeOwnPassword('old', 'new').subscribe({ next: done, error });
    expectRequest('/api/admin/superuser/password').flush(null);
    expectRequest('/api/admin/superuser/login').flush(null, serverError);

    expect(done).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('sends a superuser without a stored client ID to log in after a password change', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.superLogin('admin', 'secret').subscribe();
    expectRequest('/api/admin/superuser/login').flush(null);
    localStorage.removeItem('superuserClientId');

    auth.changeOwnPassword('old', 'new').subscribe();
    expectRequest('/api/admin/superuser/password').flush(null);

    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
