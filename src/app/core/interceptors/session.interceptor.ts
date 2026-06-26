import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionId = inject(AuthService).sessionId();

  if (sessionId) {
    return next(req.clone({ setHeaders: { 'x-krb-session': sessionId } }));
  }

  return next(req);
};
