import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/login/login.routes').then(m => m.LOGIN_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.USERS_ROUTES),
      },
      {
        path: 'groups',
        loadChildren: () =>
          import('./features/groups/groups.routes').then(m => m.GROUPS_ROUTES),
      },
      {
        path: 'permissions',
        loadChildren: () =>
          import('./features/permissions/permissions.routes').then(m => m.PERMISSIONS_ROUTES),
      },
      {
        path: 'debug',
        loadChildren: () =>
          import('./features/debug/debug.routes').then(m => m.DEBUG_ROUTES),
      },
      {
        path: 'flow',
        loadChildren: () =>
          import('./features/flow/flow.routes').then(m => m.FLOW_ROUTES),
      },
      {
        path: 'oas',
        loadChildren: () =>
          import('./features/oas/oas.routes').then(m => m.OAS_ROUTES),
      },
      {
        path: 'auth-basic',
        loadChildren: () =>
          import('./features/auth-basic/auth-basic.routes').then(m => m.AUTH_BASIC_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
