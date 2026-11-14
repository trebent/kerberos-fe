import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';

import { confirmDelete } from '../../components/confirm-delete/confirm-delete';
import { RequestFeedback } from '../../components/request-feedback/request-feedback';
import { Skeleton } from '../../components/skeleton/skeleton';
import { Organisation, OrganisationsService } from '../../services/auth-basic';
import { Notifier } from '../../services/notifier.service';
import { requestStatus } from '../../utils/request-status';
import { skeletonVisible } from '../../utils/skeleton-visible';
import { NameDialog, NameDialogData } from './components/name-dialog/name-dialog';
import { OrgGroupsList } from './components/org-groups-list/org-groups-list';
import { OrgUsersList } from './components/org-users-list/org-users-list';
import { OrganisationsList } from './components/organisations-list/organisations-list';

/**
 * Organisations on the left; the selected one's users and groups on the right. The selection
 * is the `org` query parameter, so it survives a reload and the back button returns to the
 * previous organisation.
 */
@Component({
  imports: [
    MatIcon,
    MatIconButton,
    OrgGroupsList,
    OrgUsersList,
    OrganisationsList,
    RequestFeedback,
    Skeleton,
  ],
  selector: 'app-auth-basic',
  styleUrl: './auth-basic.scss',
  templateUrl: './auth-basic.html',
})
export class AuthBasic {
  private readonly orgsService = inject(OrganisationsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  /** The `org` query parameter, bound by the router. */
  readonly org = input<string>();

  protected readonly selectedOrgId = computed(() => {
    const id = Number(this.org());
    return this.org() && Number.isInteger(id) ? id : undefined;
  });

  protected readonly orgsResource = rxResource({
    stream: () => this.orgsService.listOrganisations(),
  });

  protected readonly selectedOrg = computed(() =>
    this.orgsResource.value()?.find((org) => org.id === this.selectedOrgId()),
  );
  /** The selected organisation's name is not known until the list loads. */
  protected readonly showOrgNameSkeleton = skeletonVisible(
    () => this.orgsResource.isLoading() && !this.selectedOrg(),
  );

  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete organisation. Please try again.',
  });

  /** The dialog closes with the saved name, or nothing when cancelled. */
  protected renameOrg(org: Organisation): void {
    const data: NameDialogData = {
      heading: 'Rename organisation',
      submitLabel: 'Save',
      name: org.name,
      save: (name) => this.orgsService.updateOrganisation(org.id, { id: org.id, name }),
    };
    this.dialog
      .open<NameDialog, NameDialogData, string>(NameDialog, { data })
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`Organisation renamed to ${name}`);
        this.orgsResource.reload();
      });
  }

  protected deleteOrg(org: Organisation): void {
    confirmDelete(this.dialog, `organisation ${org.name}`).subscribe(() =>
      this.deleteStatus.run(this.orgsService.deleteOrganisation(org.id), () => {
        this.notifier.show(`Organisation ${org.name} deleted`);
        this.orgsResource.reload();
        void this.router.navigate([], { queryParams: {} });
      }),
    );
  }
}
