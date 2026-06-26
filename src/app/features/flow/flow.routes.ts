import { Routes } from '@angular/router';

export const FLOW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./flow.component').then(m => m.FlowComponent),
  },
];
