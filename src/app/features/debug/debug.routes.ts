import { Routes } from '@angular/router';

export const DEBUG_ROUTES: Routes = [
  {
    path: ':backend/sessions',
    loadComponent: () =>
      import('./sessions-list/sessions-list.component').then(m => m.SessionsListComponent),
  },
  {
    path: ':backend/sessions/:id',
    loadComponent: () =>
      import('./session-detail/session-detail.component').then(m => m.SessionDetailComponent),
  },
  {
    path: ':backend/sessions/:id/calls',
    loadComponent: () =>
      import('./session-calls/session-calls.component').then(m => m.SessionCallsComponent),
  },
];
