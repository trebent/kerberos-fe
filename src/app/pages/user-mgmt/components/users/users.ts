import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { confirmDelete } from '../../../../components/confirm-delete/confirm-delete';
import { ListCard } from '../../../../components/list-card/list-card';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { User, UsersService } from '../../../../services/admin';
import { Notifier } from '../../../../services/notifier.service';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { UserCreate } from '../user-create/user-create';
import { UserEdit } from '../user-edit/user-edit';

@Component({
  imports: [ListCard, RequestFeedback, ...MAT_TABLE, RowActions],
  selector: 'app-users',
  templateUrl: './users.html',
})
export class Users {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly displayedColumns = ['id', 'username', 'groups', 'actions'];

  protected readonly usersResource = rxResource({
    stream: () => this.usersService.getUsers(),
  });

  protected readonly joinNames = joinNames;
  protected readonly dataSource = resourceDataSource(this.usersResource);

  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete user. Please try again.',
  });

  /** The dialogs close with the saved username, or nothing when cancelled. */
  protected addUser(): void {
    this.dialog
      .open<UserCreate, void, string>(UserCreate)
      .afterClosed()
      .subscribe((username) => {
        if (username === undefined) return;
        this.notifier.show(`User ${username} created`);
        this.usersResource.reload();
      });
  }

  protected editUser(user: User): void {
    this.dialog
      .open<UserEdit, User, string>(UserEdit, { data: user })
      .afterClosed()
      .subscribe((username) => {
        if (username === undefined) return;
        this.notifier.show(`User ${username} updated`);
        this.usersResource.reload();
      });
  }

  protected deleteUser(user: User): void {
    confirmDelete(this.dialog, `user ${user.username}`).subscribe(() =>
      this.deleteStatus.run(this.usersService.deleteUser(user.id), () => {
        this.notifier.show(`User ${user.username} deleted`);
        this.usersResource.reload();
      }),
    );
  }
}
