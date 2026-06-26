import { Routes } from '@angular/router';

export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./groups-list/groups-list.component').then(m => m.GroupsListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./group-detail/group-detail.component').then(m => m.GroupDetailComponent),
  },
];
