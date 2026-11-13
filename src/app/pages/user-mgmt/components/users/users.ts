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

  protected readonly displayedColumns = ['id', 'username', 'groups', 'actions'];

  protected readonly usersResource = rxResource({
    stream: () => this.usersService.getUsers(),
  });

  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = resourceDataSource(this.usersResource, this.paginator);

  protected readonly createErrors = signal<string[]>([]);
  protected readonly deleteErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly selectedUser = signal<User | null>(null);

  /** The user's group names for the table, or a dash when they have none. */
  protected groupNames(user: User): string {
    return user.groups?.length ? user.groups.map((group) => group.name).join(', ') : '—';
  }

  protected applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  protected submitCreate(): void {
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

  protected openEdit(user: User): void {
    this.selectedUser.set(user);
  }

  protected onDetailSaved(): void {
    this.selectedUser.set(null);
    this.usersResource.reload();
  }

  protected onDetailClosed(): void {
    this.selectedUser.set(null);
  }

  protected deleteUser(userId: number): void {
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
