import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { UsersListComponent } from './users/users-list/users-list.component';
import { GroupsListComponent } from './groups/groups-list/groups-list.component';
import { PermissionsListComponent } from './permissions/permissions-list.component';

@Component({
  selector: 'app-user-mgmt',
  templateUrl: './user-mgmt.component.html',
  imports: [ProfileComponent, UsersListComponent, GroupsListComponent, PermissionsListComponent],
})
export class UserMgmtComponent {}
