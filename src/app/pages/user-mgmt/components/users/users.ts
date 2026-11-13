import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { User, UsersService } from '../../../../services/admin';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { UserEdit } from '../user-edit/user-edit';

@Component({
  host: { class: 'section-card' },
  imports: [
    RequestFeedback,
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

  protected readonly joinNames = joinNames;
  protected readonly dataSource = resourceDataSource(this.usersResource);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create user. Please try again.',
  });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete user. Please try again.',
  });
  protected readonly createForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly selectedUser = signal<User | null>(null);

  protected submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createStatus.run(this.usersService.createUser(this.createForm.getRawValue()), () => {
      this.createForm.reset();
      this.usersResource.reload();
    });
  }

  protected onDetailSaved(): void {
    this.selectedUser.set(null);
    this.usersResource.reload();
  }

  protected deleteUser(user: User): void {
    this.deleteStatus.run(this.usersService.deleteUser(user.id), () => {
      if (this.selectedUser()?.id === user.id) {
        this.selectedUser.set(null);
      }
      this.usersResource.reload();
    });
  }
}
