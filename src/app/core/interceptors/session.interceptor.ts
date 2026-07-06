import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const CSRF_EXEMPT_URLS = [
  '/api/admin/login',
  '/api/admin/superuser/login',
];

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (CSRF_EXEMPT_URLS.some(url => req.url.endsWith(url))) {
    return next(req.clone({ withCredentials: true }));
  }

  const csrfToken = getCookie('csrf');
  req = req.clone({
    withCredentials: true,
    ...(csrfToken
      ? { setHeaders: { 'X-Krb-Csrf-Token': csrfToken } }
      : {}),
  });
  if (!csrfToken) {
    console.error('"csrf" cookie not found');
  }
  return next(req);
};

export const RELOGIN_ATTEMPTED = new HttpContextToken(() => false);

// URLs where 401 retry is skipped: login endpoints (avoid infinite loops) and
// /api/admin/me (called inside relogin() itself via checkSession — skipping prevents deadlock).
const RELOGIN_EXEMPT_URLS = [
  ...CSRF_EXEMPT_URLS,
  '/api/admin/me',
];

export const autoReloginInterceptor: HttpInterceptorFn = (req, next) => {
  if (
    req.context.get(RELOGIN_ATTEMPTED) ||
    RELOGIN_EXEMPT_URLS.some(url => req.url.endsWith(url))
  ) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err?.status !== 401 || !authService.hasStoredCredentials()) {
        return throwError(() => err);
      }

      return authService.relogin().pipe(
        switchMap(() => next(req.clone({ context: req.context.set(RELOGIN_ATTEMPTED, true) }))),
        catchError(() => {
          router.navigate(['/login']);
          return throwError(() => err);
        }),
      );
    }),
  );
};
