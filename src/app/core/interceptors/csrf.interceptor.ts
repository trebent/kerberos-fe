import { HttpInterceptorFn } from '@angular/common/http';

const CSRF_COOKIE = 'csrf';
const CSRF_HEADER = 'X-Krb-Csrf-Token';

/** Login requests are made before a CSRF cookie exists. */
const CSRF_EXEMPT_URLS = ['/api/admin/login', '/api/admin/superuser/login'];

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Sends the session cookie with every request and echoes the CSRF cookie as a header. */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (CSRF_EXEMPT_URLS.some((url) => req.url.endsWith(url))) {
    return next(req.clone({ withCredentials: true }));
  }

  const csrfToken = readCookie(CSRF_COOKIE);
  if (!csrfToken) {
    console.warn(`"${CSRF_COOKIE}" cookie not found`);
  }

  return next(
    req.clone({
      withCredentials: true,
      ...(csrfToken ? { setHeaders: { [CSRF_HEADER]: csrfToken } } : {}),
    }),
  );
};
