import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    console.debug('User is logged in, allowing access to the route.');
    return true;
  }

  console.debug('User is not logged in, redirect to login.');
  return router.createUrlTree(['/login']);
};
