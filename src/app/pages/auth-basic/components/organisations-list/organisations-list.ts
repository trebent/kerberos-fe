import { Component, effect, inject, output, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';

import { MAT_TABLE } from '../../../../utils/material-table';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import {
  CreateOrganisation201Response,
  Organisation,
  OrganisationsService,
} from '../../../../services/auth-basic';
import { OrganisationDetail } from '../organisation-detail/organisation-detail';

@Component({
  imports: [
    ErrorDisplay,
    MatButton,
    MatDivider,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatPaginator,
    MatProgressSpinner,
    ...MAT_TABLE,
    ReactiveFormsModule,
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

  protected readonly dataSource = new MatTableDataSource<Organisation>();

  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    // The paginator only exists once the table is rendered.
    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });

    effect(() => {
      if (this.orgsResource.hasValue()) {
        this.dataSource.data = this.orgsResource.value();
      } else {
        this.dataSource.data = [];
      }
    });
  }

  protected readonly createErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected readonly newOrgCredentials = signal<CreateOrganisation201Response | null>(null);
  protected readonly selectedOrg = signal<Organisation | null>(null);
  protected readonly selectedOrgId = signal<number | null>(null);

  protected applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

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

  protected openEdit(org: Organisation): void {
    this.selectedOrg.set(org);
  }

  protected onDetailSaved(): void {
    this.selectedOrg.set(null);
    this.orgsResource.reload();
  }

  protected onDetailClosed(): void {
    this.selectedOrg.set(null);
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
