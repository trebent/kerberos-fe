import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { UsersListComponent } from './users/users-list/users-list.component';
import { GroupsListComponent } from './groups/groups-list/groups-list.component';
import { PermissionsComponent } from './permissions/permissions.component';

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
    <app-permissions />
  `,
  imports: [ProfileComponent, UsersListComponent, GroupsListComponent, PermissionsComponent],
})
export class UserMgmtComponent {}
