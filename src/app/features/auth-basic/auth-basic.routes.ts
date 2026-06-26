import { Routes } from '@angular/router';

export const AUTH_BASIC_ROUTES: Routes = [
  {
    path: 'organisations',
    loadComponent: () =>
      import('./organisations/organisations-list/organisations-list.component').then(
        m => m.OrganisationsListComponent
      ),
  },
  {
    path: 'organisations/:orgId',
    loadComponent: () =>
      import('./organisations/organisation-detail/organisation-detail.component').then(
        m => m.OrganisationDetailComponent
      ),
  },
  {
    path: 'organisations/:orgId/users',
    loadComponent: () =>
      import('./org-users/org-users-list/org-users-list.component').then(
        m => m.OrgUsersListComponent
      ),
  },
  {
    path: 'organisations/:orgId/users/:userId',
    loadComponent: () =>
      import('./org-users/org-user-detail/org-user-detail.component').then(
        m => m.OrgUserDetailComponent
      ),
  },
  {
    path: 'organisations/:orgId/groups',
    loadComponent: () =>
      import('./org-groups/org-groups-list/org-groups-list.component').then(
        m => m.OrgGroupsListComponent
      ),
  },
  {
    path: 'organisations/:orgId/groups/:groupId',
    loadComponent: () =>
      import('./org-groups/org-group-detail/org-group-detail.component').then(
        m => m.OrgGroupDetailComponent
      ),
  },
];
