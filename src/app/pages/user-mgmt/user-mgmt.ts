import { Component } from '@angular/core';

import { Groups } from './components/groups/groups';
import { PermissionsList } from './components/permissions-list/permissions-list';
import { Profile } from './components/profile/profile';
import { Users } from './components/users/users';

@Component({
  imports: [Groups, PermissionsList, Profile, Users],
  selector: 'app-user-mgmt',
  styleUrl: './user-mgmt.scss',
  templateUrl: './user-mgmt.html',
})
export class UserMgmt {}
