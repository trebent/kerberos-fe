import { Component, signal } from '@angular/core';

import { OrgGroupsList } from './components/org-groups-list/org-groups-list';
import { OrgUsersList } from './components/org-users-list/org-users-list';
import { OrganisationsList } from './components/organisations-list/organisations-list';

@Component({
  imports: [OrgGroupsList, OrgUsersList, OrganisationsList],
  selector: 'app-auth-basic',
  templateUrl: './auth-basic.html',
})
export class AuthBasic {
  protected readonly selectedOrgId = signal<number | null>(null);
}
