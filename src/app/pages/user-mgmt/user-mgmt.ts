import { Component } from '@angular/core';

import { Groups } from './components/groups/groups';
import { PermissionsList } from './components/permissions-list/permissions-list';
import { Users } from './components/users/users';

@Component({
  imports: [Groups, PermissionsList, Users],
  selector: 'app-user-mgmt',
  templateUrl: './user-mgmt.html',
})
export class UserMgmt {}
