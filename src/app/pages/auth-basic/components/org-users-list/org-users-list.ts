import { Component, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { of } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { User, UsersService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { OrgUserDetail } from '../org-user-detail/org-user-detail';

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
    OrgUserDetail,
  ],
  selector: 'app-org-users-list',
  templateUrl: './org-users-list.html',
})
export class OrgUsersList {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  readonly displayedColumns = ['id', 'name', 'groups', 'actions'];

  readonly usersResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<User[]>([]);
      }
      return this.usersService.listUsers(orgId);
    },
  });

  private readonly paginator = viewChild(MatPaginator);
  readonly dataSource = resourceDataSource(this.usersResource, this.paginator);

  readonly createErrors = signal<string[]>([]);
  readonly deleteErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** The user being edited. Switching organisation closes the edit panel. */
  readonly selectedUser = linkedSignal<number | null, User | null>({
    source: this.orgId,
    computation: () => null,
  });

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.orgId() === null) return;
    this.createErrors.set([]);
    const { name, password } = this.createForm.getRawValue();
    this.usersService.createUser(this.orgId()!, { name, password }).subscribe({
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

  onDataChanged(): void {
    this.usersResource.reload();
  }

  onDetailClosed(): void {
    this.selectedUser.set(null);
  }

  deleteUser(userId: number): void {
    const orgId = this.orgId();
    if (orgId === null) return;

    this.deleteErrors.set([]);
    this.usersService.deleteUser(orgId, userId).subscribe({
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
