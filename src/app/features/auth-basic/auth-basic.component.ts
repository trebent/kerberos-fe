import { Component, signal } from '@angular/core';
import { OrganisationsListComponent } from './organisations/organisations-list/organisations-list.component';
import { OrgGroupsListComponent } from './org-groups/org-groups-list/org-groups-list.component';
import { OrgUsersListComponent } from './org-users/org-users-list/org-users-list.component';

@Component({
  selector: 'app-auth-basic',
  templateUrl: './auth-basic.component.html',
  styleUrl: './auth-basic.component.scss',
  imports: [OrganisationsListComponent, OrgUsersListComponent, OrgGroupsListComponent],
})
export class AuthBasicComponent {
  readonly selectedOrgId = signal<number | null>(null);
}
