import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { of } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { User, UsersService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { OrgUserDetail } from '../org-user-detail/org-user-detail';

@Component({
  imports: [
    ErrorDisplay,
    FilteredTable,
    MatButton,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ...MAT_TABLE,
    ReactiveFormsModule,
    RowActions,
    OrgUserDetail,
  ],
  selector: 'app-org-users-list',
  styleUrl: './org-users-list.scss',
  templateUrl: './org-users-list.html',
})
export class OrgUsersList {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  protected readonly displayedColumns = ['id', 'name', 'groups', 'actions'];

  protected readonly usersResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<User[]>([]);
      }
      return this.usersService.listUsers(orgId);
    },
  });

  protected readonly joinNames = joinNames;
  protected readonly dataSource = resourceDataSource(this.usersResource);

  protected readonly createErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** The user being edited. Switching organisation closes the edit panel. */
  protected readonly selectedUser = linkedSignal<number | null, User | null>({
    source: this.orgId,
    computation: () => null,
  });

  protected submitCreate(): void {
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

  protected onDataChanged(): void {
    this.usersResource.reload();
  }

  protected deleteUser(userId: number): void {
    if (this.orgId() === null) return;
    if (this.selectedUser()?.id === userId) {
      this.selectedUser.set(null);
    }
    this.usersService.deleteUser(this.orgId()!, userId).subscribe({
      next: () => this.usersResource.reload(),
    });
  }
}
