import { Component, inject, model, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { ListCard } from '../../../../components/list-card/list-card';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import {
  CreateOrganisation201Response,
  Organisation,
  OrganisationsService,
} from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { requestStatus } from '../../../../utils/request-status';
import { RenameDialog, RenameDialogData } from '../rename-dialog/rename-dialog';

@Component({
  imports: [
    ListCard,
    RequestFeedback,
    FilteredTable,
    FormField,
    FormRoot,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ...MAT_TABLE,
    RowActions,
  ],
  selector: 'app-organisations-list',
  styleUrl: './organisations-list.scss',
  templateUrl: './organisations-list.html',
})
export class OrganisationsList {
  private readonly orgsService = inject(OrganisationsService);
  private readonly dialog = inject(MatDialog);

  /** The organisation whose users and groups the page manages. */
  readonly selectedOrgId = model<number | null>(null);

  protected readonly displayedColumns = ['id', 'name', 'actions'];

  protected readonly orgsResource = rxResource({
    stream: () => this.orgsService.listOrganisations(),
  });

  protected readonly dataSource = resourceDataSource(this.orgsResource);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create organisation. Please try again.',
  });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete organisation. Please try again.',
  });
  protected readonly createForm = form(signal({ name: '' }), (path) => required(path.name), {
    submission: { action: async () => this.create() },
  });

  protected readonly newOrgCredentials = signal<CreateOrganisation201Response | null>(null);

  private create(): void {
    const request$ = this.orgsService.createOrganisation(this.createForm().value());
    this.createStatus.run(request$, (credentials) => {
      this.createForm().reset({ name: '' });
      this.newOrgCredentials.set(credentials);
      this.orgsResource.reload();
    });
  }

  /** Selects an organisation, or clears the selection when it is already selected. */
  protected toggleSelected(org: Organisation): void {
    this.selectedOrgId.update((id) => (id === org.id ? null : org.id));
  }

  protected renameOrg(org: Organisation): void {
    const data: RenameDialogData = {
      heading: 'Edit organisation',
      name: org.name,
      rename: (name) => this.orgsService.updateOrganisation(org.id, { id: org.id, name }),
    };
    this.dialog
      .open<RenameDialog, RenameDialogData, boolean>(RenameDialog, { data })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.orgsResource.reload();
      });
  }

  protected deleteOrg(org: Organisation): void {
    this.deleteStatus.run(this.orgsService.deleteOrganisation(org.id), () => {
      if (this.selectedOrgId() === org.id) {
        this.selectedOrgId.set(null);
      }
      this.orgsResource.reload();
    });
  }
}
