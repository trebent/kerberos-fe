import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { GroupsService } from '../../../../api/auth-basic/api/groups.service';
import { Group } from '../../../../api/auth-basic/model/group';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { OrgGroupDetailComponent } from '../org-group-detail/org-group-detail.component';

@Component({
  selector: 'app-org-groups-list',
  template: `
    @if (orgId() === null) {
      <p class="prompt-message">Select an organisation above to manage its groups.</p>
    } @else {
      @if (groupsResource.isLoading()) {
        <mat-spinner diameter="32" />
      }
      @if (groupsResource.error()) {
        <app-error-display [errors]="['Failed to load groups.']" />
      }

      <div class="action-bar">
        @if (!showCreate()) {
          <button mat-flat-button (click)="openCreate()">
            <mat-icon>add</mat-icon> Create Group
          </button>
        }
      </div>

      @if (showCreate()) {
        <section class="form-section">
          <h4>Create Group</h4>
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

      @if (groupsResource.hasValue()) {
        <table mat-table [dataSource]="groupsResource.value()!">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let g">{{ g.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let g">{{ g.name }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let g">
              <button mat-icon-button (click)="openEdit(g)" aria-label="Edit group">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="deleteGroup(g.id)" aria-label="Delete group">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      }

      @if (selectedGroup() && orgId() !== null) {
        <app-org-group-detail
          [orgId]="orgId()!"
          [group]="selectedGroup()!"
          (saved)="onDetailSaved()"
          (cancelled)="onDetailCancelled()"
        />
      }
    }
  `,
  styles: [`
    .prompt-message {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
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
    OrgGroupDetailComponent,
  ],
})
export class OrgGroupsListComponent {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  readonly displayedColumns = ['id', 'name', 'actions'];

  readonly groupsResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<Group[]>([]);
      }
      return this.groupsService.listGroups(orgId);
    },
  });

  readonly showCreate = signal(false);
  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly selectedGroup = signal<Group | null>(null);

  openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.selectedGroup.set(null);
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.orgId() === null) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.groupsService.createGroup(this.orgId()!, { name }).subscribe({
      next: () => {
        this.showCreate.set(false);
        this.createForm.reset();
        this.groupsResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create group. Please try again.']);
      },
    });
  }

  openEdit(group: Group): void {
    this.showCreate.set(false);
    this.selectedGroup.set(group);
  }

  onDetailSaved(): void {
    this.selectedGroup.set(null);
    this.groupsResource.reload();
  }

  onDetailCancelled(): void {
    this.selectedGroup.set(null);
  }

  deleteGroup(groupId: number): void {
    if (this.orgId() === null) return;
    if (this.selectedGroup()?.id === groupId) {
      this.selectedGroup.set(null);
    }
    this.groupsService.deleteGroup(this.orgId()!, groupId).subscribe({
      next: () => this.groupsResource.reload(),
    });
  }
}
