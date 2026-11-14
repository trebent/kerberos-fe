import { Component, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
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
import { Rename, RenamePanel } from '../rename-panel/rename-panel';

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
    RenamePanel,
  ],
  selector: 'app-organisations-list',
  styleUrl: './organisations-list.scss',
  templateUrl: './organisations-list.html',
})
export class OrganisationsList {
  private readonly orgsService = inject(OrganisationsService);

  readonly orgSelected = output<number | null>();

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

  protected readonly renameOrganisation: Rename = (id, name) =>
    this.orgsService.updateOrganisation(id, { id, name });

  protected readonly newOrgCredentials = signal<CreateOrganisation201Response | null>(null);
  protected readonly selectedOrg = signal<Organisation | null>(null);
  protected readonly selectedOrgId = signal<number | null>(null);

  private create(): void {
    const request$ = this.orgsService.createOrganisation(this.createForm().value());
    this.createStatus.run(request$, (credentials) => {
      this.createForm().reset({ name: '' });
      this.newOrgCredentials.set(credentials);
      this.orgsResource.reload();
    });
  }

  protected toggleManage(org: Organisation): void {
    const current = this.selectedOrgId();
    if (current === org.id) {
      this.selectedOrgId.set(null);
      this.orgSelected.emit(null);
    } else {
      this.selectedOrgId.set(org.id);
      this.orgSelected.emit(org.id);
    }
  }

  protected onDetailSaved(): void {
    this.selectedOrg.set(null);
    this.orgsResource.reload();
  }

  protected deleteOrg(org: Organisation): void {
    this.deleteStatus.run(this.orgsService.deleteOrganisation(org.id), () => {
      if (this.selectedOrgId() === org.id) {
        this.selectedOrgId.set(null);
        this.orgSelected.emit(null);
      }
      if (this.selectedOrg()?.id === org.id) {
        this.selectedOrg.set(null);
      }
      this.orgsResource.reload();
    });
  }
}
