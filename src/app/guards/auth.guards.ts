import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Lets signed-in users through; sends everyone else to log in. */
export const authGuard: CanActivateFn = () => {
  if (inject(AuthService).isLoggedIn()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};

/** Keeps signed-in users off the log in page. */
export const guestGuard: CanActivateFn = () => {
  if (!inject(AuthService).isLoggedIn()) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};
