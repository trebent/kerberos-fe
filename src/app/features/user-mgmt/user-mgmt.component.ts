import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { UsersListComponent } from './users/users-list/users-list.component';
import { GroupsListComponent } from './groups/groups-list/groups-list.component';
import { PermissionsListComponent } from './permissions/permissions-list/permissions-list.component';

@Component({
  selector: 'app-user-mgmt',
  template: `
    <h2>User Management</h2>

    <app-profile />

    <h3>Users</h3>
    <app-users-list />

    <h3>Groups</h3>
    <app-groups-list />

    <h3>Permissions</h3>
    <app-permissions-list />
  `,
  imports: [ProfileComponent, UsersListComponent, GroupsListComponent, PermissionsListComponent],
})
export class UserMgmtComponent {}
