import { Routes } from '@angular/router';

export const PERMISSIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./permissions.component').then(m => m.PermissionsComponent),
  },
];
