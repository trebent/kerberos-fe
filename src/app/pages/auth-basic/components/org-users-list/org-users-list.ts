import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { confirmDelete } from '../../../../components/confirm-delete/confirm-delete';
import { ListCard } from '../../../../components/list-card/list-card';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { User, UsersService } from '../../../../services/auth-basic';
import { Notifier } from '../../../../services/notifier.service';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { OrgUserCreate, OrgUserCreateData } from '../org-user-create/org-user-create';
import { OrgUserDetail, OrgUserDetailData } from '../org-user-detail/org-user-detail';

/** The users of one organisation. */
@Component({
  imports: [ListCard, RequestFeedback, ...MAT_TABLE, RowActions],
  selector: 'app-org-users-list',
  templateUrl: './org-users-list.html',
})
export class OrgUsersList {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  readonly orgId = input.required<number>();

  protected readonly displayedColumns = ['id', 'name', 'groups', 'actions'];

  protected readonly usersResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => this.usersService.listUsers(orgId),
  });

  protected readonly joinNames = joinNames;
  protected readonly dataSource = resourceDataSource(this.usersResource);

  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete user. Please try again.',
  });

  /** The dialogs close with the saved name, or nothing when cancelled. */
  protected addUser(): void {
    this.dialog
      .open<OrgUserCreate, OrgUserCreateData, string>(OrgUserCreate, {
        data: { orgId: this.orgId() },
      })
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`User ${name} created`);
        this.usersResource.reload();
      });
  }

  protected editUser(user: User): void {
    this.dialog
      .open<OrgUserDetail, OrgUserDetailData, string>(OrgUserDetail, {
        data: { orgId: this.orgId(), user },
      })
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`User ${name} updated`);
        this.usersResource.reload();
      });
  }

  protected deleteUser(user: User): void {
    confirmDelete(this.dialog, `user ${user.name}`).subscribe(() =>
      this.deleteStatus.run(this.usersService.deleteUser(this.orgId(), user.id), () => {
        this.notifier.show(`User ${user.name} deleted`);
        this.usersResource.reload();
      }),
    );
  }
}
