import { Component, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { OrganisationsService } from '../../../../api/auth-basic/api/organisations.service';
import { CreateOrganisation201Response } from '../../../../api/auth-basic/model/create-organisation201-response';
import { Organisation } from '../../../../api/auth-basic/model/organisation';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { OrganisationDetailComponent } from '../organisation-detail/organisation-detail.component';

@Component({
  selector: 'app-organisations-list',
  template: `
    @if (orgsResource.isLoading()) {
      <mat-spinner diameter="32" />
    }
    @if (orgsResource.error()) {
      <app-error-display [errors]="['Failed to load organisations.']" />
    }

    <div class="action-bar">
      @if (!showCreate()) {
        <button mat-flat-button (click)="openCreate()">
          <mat-icon>add</mat-icon> Create Organisation
        </button>
      }
    </div>

    @if (showCreate()) {
      <section class="form-section">
        <h4>Create Organisation</h4>
        @if (createErrors().length) {
          <app-error-display [errors]="createErrors()" />
        }
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <div class="form-actions">
            <button mat-flat-button type="submit" [disabled]="createForm.invalid">Create</button>
            <button mat-button type="button" (click)="cancelCreate()">Cancel</button>
          </div>
        </form>
      </section>
    }

    @if (newOrgCredentials()) {
      <section class="credentials-box">
        <strong>Organisation created — save these admin credentials now, they will not be shown again.</strong>
        <p>Admin username: <code>{{ newOrgCredentials()!.adminUsername }}</code></p>
        <p>Admin password: <code>{{ newOrgCredentials()!.adminPassword }}</code></p>
        <button mat-button (click)="dismissCredentials()">Dismiss</button>
      </section>
    }

    @if (orgsResource.hasValue()) {
      <table mat-table [dataSource]="orgsResource.value()!">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let o">{{ o.id }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let o">{{ o.name }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let o">
            <button
              mat-stroked-button
              [color]="selectedOrgId() === o.id ? 'primary' : ''"
              (click)="toggleManage(o)"
            >Manage</button>
            <button mat-icon-button (click)="openEdit(o)" aria-label="Edit organisation">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="deleteOrg(o.id)" aria-label="Delete organisation">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }

    @if (selectedOrg()) {
      <app-organisation-detail
        [organisation]="selectedOrg()!"
        (saved)="onDetailSaved()"
        (cancelled)="onDetailCancelled()"
      />
    }
  `,
  styles: [`
    .action-bar {
      margin-bottom: 16px;
    }
    .form-section {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
    }
    h4 {
      margin: 0 0 12px;
    }
    form {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    mat-form-field {
      width: 320px;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .credentials-box {
      margin: 16px 0;
      padding: 16px;
      border: 2px solid var(--mat-sys-primary);
      border-radius: 8px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .credentials-box p {
      margin: 8px 0;
    }
    code {
      font-family: monospace;
      font-size: 0.95em;
    }
  `],
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
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

  readonly showCreate = signal(false);
  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly newOrgCredentials = signal<CreateOrganisation201Response | null>(null);
  readonly selectedOrg = signal<Organisation | null>(null);
  readonly selectedOrgId = signal<number | null>(null);

  openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.selectedOrg.set(null);
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.orgsService.createOrganisation({ name }).subscribe({
      next: (resp) => {
        this.showCreate.set(false);
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
    this.showCreate.set(false);
    this.selectedOrg.set(org);
  }

  onDetailSaved(): void {
    this.selectedOrg.set(null);
    this.orgsResource.reload();
  }

  onDetailCancelled(): void {
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
