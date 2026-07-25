import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';
import { GroupsComponent } from './groups/groups.component';
import { PermissionsListComponent } from './permissions/permissions-list.component';

@Component({
  selector: 'app-user-mgmt',
  templateUrl: './user-mgmt.component.html',
  styleUrl: './user-mgmt.component.scss',
  imports: [ProfileComponent, UsersComponent, GroupsComponent, PermissionsListComponent],
})
export class UserMgmtComponent { }
