import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';
import { GroupsListComponent } from './groups/groups-list/groups-list.component';
import { PermissionsListComponent } from './permissions/permissions-list.component';

@Component({
  selector: 'app-user-mgmt',
  templateUrl: './user-mgmt.component.html',
  styleUrl: './user-mgmt.component.scss',
  imports: [ProfileComponent, UsersComponent, GroupsListComponent, PermissionsListComponent],
})
export class UserMgmtComponent { }
