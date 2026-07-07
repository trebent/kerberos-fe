import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/landing/landing.component').then(m => m.LandingComponent),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'flow',
        loadComponent: () =>
          import('./features/flow/flow.component').then(m => m.FlowComponent),
      },
      {
        path: 'user-mgmt',
        loadComponent: () =>
          import('./features/user-mgmt/user-mgmt.component').then(m => m.UserMgmtComponent),
      },
      {
        path: 'auth-basic',
        loadComponent: () =>
          import('./features/auth-basic/auth-basic.component').then(m => m.AuthBasicComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
