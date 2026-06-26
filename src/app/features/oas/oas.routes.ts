import { Routes } from '@angular/router';

export const OAS_ROUTES: Routes = [
  {
    path: ':backend',
    loadComponent: () =>
      import('./oas.component').then(m => m.OasComponent),
  },
];
