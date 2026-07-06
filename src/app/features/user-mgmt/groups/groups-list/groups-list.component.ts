import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UsersService } from '../../../../api/admin/api/users.service';
import { Group } from '../../../../api/admin/model/group';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { GroupDetailComponent } from '../group-detail/group-detail.component';

@Component({
  selector: 'app-groups-list',
  template: `
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
          @if (permissionsResource.hasValue()) {
            <fieldset class="permissions-fieldset">
              <legend>Permissions</legend>
              @for (p of permissionsResource.value()!; track p.id) {
                <mat-checkbox [checked]="isCreateSelected(p.id)" (change)="toggleCreatePermission(p.id)">
                  {{ p.name }}
                </mat-checkbox>
              }
            </fieldset>
          }
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

    @if (selectedGroup()) {
      <app-group-detail
        [group]="selectedGroup()!"
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
      gap: 8px;
    }
    mat-form-field {
      width: 320px;
    }
    .permissions-fieldset {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 4px;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .permissions-fieldset legend {
      font: var(--mat-sys-label-medium);
      padding: 0 4px;
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
    MatCheckboxModule,
    ErrorDisplayComponent,
    GroupDetailComponent,
  ],
})
export class GroupsListComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id', 'name', 'actions'];

  readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  readonly createSelectedPermissionIds = signal<number[]>([]);

  readonly showCreate = signal(false);
  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly selectedGroup = signal<Group | null>(null);

  isCreateSelected(permissionId: number): boolean {
    return this.createSelectedPermissionIds().includes(permissionId);
  }

  toggleCreatePermission(permissionId: number): void {
    const current = this.createSelectedPermissionIds();
    if (current.includes(permissionId)) {
      this.createSelectedPermissionIds.set(current.filter(id => id !== permissionId));
    } else {
      this.createSelectedPermissionIds.set([...current, permissionId]);
    }
  }

  openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.createSelectedPermissionIds.set([]);
    this.selectedGroup.set(null);
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.usersService.createGroup({ name, permissionIDs: this.createSelectedPermissionIds() }).subscribe({
      next: () => {
        this.showCreate.set(false);
        this.createForm.reset();
        this.createSelectedPermissionIds.set([]);
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
    if (this.selectedGroup()?.id === groupId) {
      this.selectedGroup.set(null);
    }
    this.usersService.deleteGroup(groupId).subscribe({
      next: () => this.groupsResource.reload(),
    });
  }
}
