import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'flow' },
  {
    path: 'login',
    title: 'Log in · Kerberos',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'flow',
    title: 'Flow · Kerberos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/flow/flow').then((m) => m.Flow),
  },
  {
    path: 'user-mgmt',
    title: 'Users · Kerberos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/user-mgmt/user-mgmt').then((m) => m.UserMgmt),
  },
  {
    path: 'auth-basic',
    title: 'Basic authentication · Kerberos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/auth-basic/auth-basic').then((m) => m.AuthBasic),
  },
  { path: '**', redirectTo: '' },
];
