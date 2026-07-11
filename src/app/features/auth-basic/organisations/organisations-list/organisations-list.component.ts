import { Component, effect, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { OrganisationsService } from '../../../../api/auth-basic/api/organisations.service';
import { CreateOrganisation201Response } from '../../../../api/auth-basic/model/create-organisation201-response';
import { Organisation } from '../../../../api/auth-basic/model/organisation';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { OrganisationDetailComponent } from '../organisation-detail/organisation-detail.component';

@Component({
  selector: 'app-organisations-list',
  templateUrl: './organisations-list.component.html',
  styleUrl: './organisations-list.component.scss',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    ErrorDisplayComponent,
    OrganisationDetailComponent,
  ],
})
export class OrganisationsListComponent {
  private readonly orgsService = inject(OrganisationsService);
  private readonly fb = inject(FormBuilder);

  readonly orgSelected = output<number | null>();

  readonly displayedColumns = ['id', 'name', 'actions'];

  readonly orgsResource = rxResource({
    stream: () => this.orgsService.listOrganisations(),
  });

  readonly dataSource = new MatTableDataSource<Organisation>();

  constructor() {
    effect(() => {
      this.dataSource.data = this.orgsResource.value() ?? [];
    });
  }

  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly newOrgCredentials = signal<CreateOrganisation201Response | null>(null);
  readonly selectedOrg = signal<Organisation | null>(null);
  readonly selectedOrgId = signal<number | null>(null);

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  submitCreate(): void {
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

  dismissCredentials(): void {
    this.newOrgCredentials.set(null);
  }

  toggleManage(org: Organisation): void {
    const current = this.selectedOrgId();
    if (current === org.id) {
      this.selectedOrgId.set(null);
      this.orgSelected.emit(null);
    } else {
      this.selectedOrgId.set(org.id);
      this.orgSelected.emit(org.id);
    }
  }

  openEdit(org: Organisation): void {
    this.selectedOrg.set(org);
  }

  onDetailSaved(): void {
    this.selectedOrg.set(null);
    this.orgsResource.reload();
  }

  onDetailClosed(): void {
    this.selectedOrg.set(null);
  }

  deleteOrg(orgId: number): void {
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
