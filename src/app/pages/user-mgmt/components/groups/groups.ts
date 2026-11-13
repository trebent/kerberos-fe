import { Component, effect, inject, signal, viewChild } from '@angular/core';
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
import { MatTableDataSource } from '@angular/material/table';

import { MAT_TABLE } from '../../../../utils/material-table';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, UsersService } from '../../../../services/admin';
import { GroupEdit } from '../group-edit/group-edit';

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
    GroupEdit,
    MatCheckbox,
  ],
  selector: 'app-groups',
  styleUrl: './groups.scss',
  templateUrl: './groups.html',
})
export class Groups {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  protected readonly displayedColumns = ['id', 'name', 'permissions', 'actions'];

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly dataSource = new MatTableDataSource<Group>();

  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    // The paginator only exists once the table is rendered.
    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });

    effect(() => {
      if (this.groupsResource.hasValue()) {
        this.dataSource.data = this.groupsResource.value();
      } else {
        this.dataSource.data = [];
      }
    });
  }

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  protected readonly createSelectedPermissionIds = signal<number[]>([]);

  protected readonly showCreate = signal(false);
  protected readonly createErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected readonly selectedGroup = signal<Group | null>(null, { equal: () => false });

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
    const current = this.createSelectedPermissionIds();
    if (current.includes(permissionId)) {
      this.createSelectedPermissionIds.set(current.filter((id) => id !== permissionId));
    } else {
      this.createSelectedPermissionIds.set([...current, permissionId]);
    }
  }

  protected openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.createSelectedPermissionIds.set([]);
    this.selectedGroup.set(null);
    this.showCreate.set(true);
  }

  protected cancelCreate(): void {
    this.showCreate.set(false);
  }

  protected submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.usersService
      .createGroup({ name, permissionIDs: this.createSelectedPermissionIds() })
      .subscribe({
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

  protected openEdit(group: Group): void {
    this.showCreate.set(false);
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
    if (this.selectedGroup()?.id === groupId) {
      this.selectedGroup.set(null);
    }
    this.usersService.deleteGroup(groupId).subscribe({
      next: () => this.groupsResource.reload(),
    });
  }
}
