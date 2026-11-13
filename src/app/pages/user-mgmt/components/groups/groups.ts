import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, UsersService } from '../../../../services/admin';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { toggleId } from '../../../../utils/selection';
import { GroupEdit } from '../group-edit/group-edit';

@Component({
  host: { class: 'section-card' },
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
    GroupEdit,
    MatCheckbox,
  ],
  selector: 'app-groups',
  templateUrl: './groups.html',
})
export class Groups {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id', 'name', 'permissions', 'actions'];

  readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  private readonly paginator = viewChild(MatPaginator);
  readonly dataSource = resourceDataSource(this.groupsResource, this.paginator);

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  readonly createSelectedPermissionIds = signal<number[]>([]);

  readonly createErrors = signal<string[]>([]);
  readonly deleteErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly selectedGroup = signal<Group | null>(null);

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  isCreateSelected(permissionId: number): boolean {
    return this.createSelectedPermissionIds().includes(permissionId);
  }

  getPermissionIDs(group: Group): string {
    return (group.permissions ?? []).map((p) => p.id).join(', ');
  }

  toggleCreatePermission(permissionId: number): void {
    this.createSelectedPermissionIds.update((ids) => toggleId(ids, permissionId));
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.usersService
      .createGroup({ name, permissionIDs: this.createSelectedPermissionIds() })
      .subscribe({
        next: () => {
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
    this.selectedGroup.set(group);
  }

  onDetailSaved(): void {
    this.selectedGroup.set(null);
    this.groupsResource.reload();
  }

  onDetailClosed(): void {
    this.selectedGroup.set(null);
  }

  deleteGroup(groupId: number): void {
    this.deleteErrors.set([]);
    this.usersService.deleteGroup(groupId).subscribe({
      next: () => {
        if (this.selectedGroup()?.id === groupId) {
          this.selectedGroup.set(null);
        }
        this.groupsResource.reload();
      },
      error: () => this.deleteErrors.set(['Failed to delete group. Please try again.']),
    });
  }
}
