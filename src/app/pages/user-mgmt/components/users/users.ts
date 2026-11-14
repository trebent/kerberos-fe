import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { ListCard } from '../../../../components/list-card/list-card';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { User, UsersService } from '../../../../services/admin';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { UserEdit } from '../user-edit/user-edit';

const NEW_USER = { username: '', password: '' };

@Component({
  imports: [
    ListCard,
    RequestFeedback,
    FilteredTable,
    FormField,
    FormRoot,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ...MAT_TABLE,
    RowActions,
  ],
  selector: 'app-users',
  templateUrl: './users.html',
})
export class Users {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);

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
  protected readonly createForm = form(
    signal(NEW_USER),
    (path) => {
      required(path.username);
      required(path.password);
    },
    { submission: { action: async () => this.create() } },
  );

  protected editUser(user: User): void {
    this.dialog
      .open<UserEdit, User, boolean>(UserEdit, { data: user })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.usersResource.reload();
      });
  }

  private create(): void {
    this.createStatus.run(this.usersService.createUser(this.createForm().value()), () => {
      this.createForm().reset(NEW_USER);
      this.usersResource.reload();
    });
  }

  protected deleteUser(user: User): void {
    this.deleteStatus.run(this.usersService.deleteUser(user.id), () => this.usersResource.reload());
  }
}
