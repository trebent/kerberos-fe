import { Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { User, UsersService } from '../../../../services/admin';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { UserEdit } from '../user-edit/user-edit';

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
    UserEdit,
  ],
  selector: 'app-users',
  templateUrl: './users.html',
})
export class Users {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id', 'username', 'groups', 'actions'];

  readonly usersResource = rxResource({
    stream: () => this.usersService.getUsers(),
  });

  private readonly paginator = viewChild(MatPaginator);
  readonly dataSource = resourceDataSource(this.usersResource, this.paginator);

  readonly createErrors = signal<string[]>([]);
  readonly deleteErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly selectedUser = signal<User | null>(null);

  /** The user's group names for the table, or a dash when they have none. */
  groupNames(user: User): string {
    return user.groups?.length ? user.groups.map((group) => group.name).join(', ') : '—';
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { username, password } = this.createForm.getRawValue();
    this.usersService.createUser({ username, password }).subscribe({
      next: () => {
        this.createForm.reset();
        this.usersResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create user. Please try again.']);
      },
    });
  }

  openEdit(user: User): void {
    this.selectedUser.set(user);
  }

  onDetailSaved(): void {
    this.selectedUser.set(null);
    this.usersResource.reload();
  }

  onDetailClosed(): void {
    this.selectedUser.set(null);
  }

  deleteUser(userId: number): void {
    this.deleteErrors.set([]);
    this.usersService.deleteUser(userId).subscribe({
      next: () => {
        if (this.selectedUser()?.id === userId) {
          this.selectedUser.set(null);
        }
        this.usersResource.reload();
      },
      error: () => this.deleteErrors.set(['Failed to delete user. Please try again.']),
    });
  }
}
