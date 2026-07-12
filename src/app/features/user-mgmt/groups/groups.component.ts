import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { UsersService } from '../../../api/admin/api/users.service';
import { Group } from '../../../api/admin/model/group';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';
import { GroupEditComponent } from './group-edit/group-edit.component';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss',
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
    GroupEditComponent,
    MatDividerModule,
  ],
})
export class GroupsComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id', 'name', 'permissions', 'actions'];

  readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  readonly dataSource = new MatTableDataSource<Group>();

  constructor() {
    effect(() => {
      this.dataSource.data = this.groupsResource.value() ?? [];
    });
  }

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  readonly createSelectedPermissionIds = signal<number[]>([]);

  readonly showCreate = signal(false);
  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly selectedGroup = signal<Group | null>(null, { equal: () => false });

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  isCreateSelected(permissionId: number): boolean {
    return this.createSelectedPermissionIds().includes(permissionId);
  }

  getPermissionIDs(group: Group): string {
    return (group.permissions ?? []).map(p => p.id).join(', ');
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

  onDetailClosed(): void {
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
