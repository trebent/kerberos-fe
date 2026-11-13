import { Component, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import {
  CreateOrganisation201Response,
  Organisation,
  OrganisationsService,
} from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { OrganisationDetail } from '../organisation-detail/organisation-detail';

@Component({
  imports: [
    ErrorDisplay,
    FilteredTable,
    MatButton,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ...MAT_TABLE,
    ReactiveFormsModule,
    RowActions,
    OrganisationDetail,
  ],
  selector: 'app-organisations-list',
  styleUrl: './organisations-list.scss',
  templateUrl: './organisations-list.html',
})
export class OrganisationsList {
  private readonly orgsService = inject(OrganisationsService);
  private readonly fb = inject(FormBuilder);

  readonly orgSelected = output<number | null>();

  protected readonly displayedColumns = ['id', 'name', 'actions'];

  protected readonly orgsResource = rxResource({
    stream: () => this.orgsService.listOrganisations(),
  });

  protected readonly dataSource = resourceDataSource(this.orgsResource);

  protected readonly createErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected readonly newOrgCredentials = signal<CreateOrganisation201Response | null>(null);
  protected readonly selectedOrg = signal<Organisation | null>(null);
  protected readonly selectedOrgId = signal<number | null>(null);

  protected submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.orgsService.createOrganisation({ name }).subscribe({
      next: (resp) => {
        this.createForm.reset();
        this.newOrgCredentials.set(resp);
        this.orgsResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create organisation. Please try again.']);
      },
    });
  }

  protected dismissCredentials(): void {
    this.newOrgCredentials.set(null);
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

  protected deleteOrg(orgId: number): void {
    if (this.selectedOrgId() === orgId) {
      this.selectedOrgId.set(null);
      this.orgSelected.emit(null);
    }
    if (this.selectedOrg()?.id === orgId) {
      this.selectedOrg.set(null);
    }
    this.orgsService.deleteOrganisation(orgId).subscribe({
      next: () => this.orgsResource.reload(),
    });
  }
}
