import { Component } from '@angular/core';
import { OrganisationsListComponent } from './organisations/organisations-list/organisations-list.component';
import { OrgUsersListComponent } from './org-users/org-users-list/org-users-list.component';
import { OrgGroupsListComponent } from './org-groups/org-groups-list/org-groups-list.component';

@Component({
  selector: 'app-auth-basic',
  template: `
    <h2>Basic Authentication</h2>

    <h3>Organisations</h3>
    <app-organisations-list />

    <h3>Organisation Users</h3>
    <app-org-users-list />

    <h3>Organisation Groups</h3>
    <app-org-groups-list />
  `,
  imports: [OrganisationsListComponent, OrgUsersListComponent, OrgGroupsListComponent],
})
export class AuthBasicComponent {}
