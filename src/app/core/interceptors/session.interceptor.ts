import { HttpInterceptorFn } from '@angular/common/http';


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
