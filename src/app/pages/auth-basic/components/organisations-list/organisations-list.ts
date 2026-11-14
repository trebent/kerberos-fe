import { Component, computed, inject, input, ResourceRef, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatListItem, MatListItemLine, MatListItemTitle, MatNavList } from '@angular/material/list';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Skeleton } from '../../../../components/skeleton/skeleton';
import { Organisation } from '../../../../services/auth-basic';
import { OrgCreate } from '../org-create/org-create';

/**
 * The organisations to choose from. Each is a link that puts its ID in the `org` query
 * parameter, which the page reads; on phones, once one is chosen, a select replaces the list.
 */
@Component({
  host: { class: 'section-card', '[class.has-selection]': 'selectedOrgId() !== undefined' },
  imports: [
    ErrorDisplay,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatListItem,
    MatListItemLine,
    MatListItemTitle,
    MatNavList,
    MatOption,
    MatPrefix,
    MatProgressBar,
    MatSelect,
    RouterLink,
    Skeleton,
  ],
  selector: 'app-organisations-list',
  styleUrl: './organisations-list.scss',
  templateUrl: './organisations-list.html',
})
export class OrganisationsList {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  /** Owned by the page, which also shows the selected organisation's name. */
  readonly organisations = input.required<ResourceRef<Organisation[] | undefined>>();
  readonly selectedOrgId = input.required<number | undefined>();

  protected readonly filterText = signal('');
  protected readonly skeletonItems = ['8rem', '6rem', '9rem', '7rem'];

  protected readonly orgs = computed(() =>
    this.organisations().hasValue() ? (this.organisations().value() ?? []) : [],
  );
  protected readonly shownOrgs = computed(() =>
    this.orgs().filter((org) => org.name.toLowerCase().includes(this.filterText())),
  );

  protected filter(event: Event): void {
    this.filterText.set((event.target as HTMLInputElement).value.trim().toLowerCase());
  }

  protected select(orgId: number): void {
    void this.router.navigate([], { queryParams: { org: orgId } });
  }

  /** Creates an organisation, then selects it. The dialog closes with its ID once created. */
  protected addOrg(): void {
    this.dialog
      .open<OrgCreate, void, number>(OrgCreate, { disableClose: true })
      .afterClosed()
      .subscribe((orgId) => {
        if (orgId === undefined) return;
        this.organisations().reload();
        this.select(orgId);
      });
  }
}
