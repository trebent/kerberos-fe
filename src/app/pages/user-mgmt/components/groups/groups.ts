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

  protected readonly displayedColumns = ['id', 'name', 'permissions', 'actions'];

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = resourceDataSource(this.groupsResource, this.paginator);

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  protected readonly createSelectedPermissionIds = signal<number[]>([]);

  protected readonly createErrors = signal<string[]>([]);
  protected readonly deleteErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected readonly selectedGroup = signal<Group | null>(null);

  protected applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  protected isCreateSelected(permissionId: number): boolean {
    return this.createSelectedPermissionIds().includes(permissionId);
  }

  protected getPermissionIDs(group: Group): string {
    return (group.permissions ?? []).map((p) => p.id).join(', ');
  }

  protected toggleCreatePermission(permissionId: number): void {
    this.createSelectedPermissionIds.update((ids) => toggleId(ids, permissionId));
  }

  protected submitCreate(): void {
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

  protected openEdit(group: Group): void {
    this.selectedGroup.set(group);
  }

  protected onDetailSaved(): void {
    this.selectedGroup.set(null);
    this.groupsResource.reload();
  }

  protected onDetailClosed(): void {
    this.selectedGroup.set(null);
  }

  protected deleteGroup(groupId: number): void {
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
