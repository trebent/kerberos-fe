import { HttpInterceptorFn } from '@angular/common/http';

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfToken = getCookie('X-KRB-CSRF-Token');
  req = req.clone({
    withCredentials: true,
    ...(csrfToken
      ? { setHeaders: { 'X-KRB-CSRF-Token': csrfToken } }
      : {}),
  });
  if (!csrfToken) {
    console.error('CSRF token not found in cookies');
  }
  return next(req);
};
