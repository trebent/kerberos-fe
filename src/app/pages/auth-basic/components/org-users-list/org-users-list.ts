import { Component, inject, input, signal } from '@angular/core';
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
import { User, UsersService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { OrgUserDetail, OrgUserDetailData } from '../org-user-detail/org-user-detail';

const NEW_USER = { name: '', password: '' };

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
  selector: 'app-org-users-list',
  templateUrl: './org-users-list.html',
})
export class OrgUsersList {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);

  readonly orgId = input.required<number | null>();

  protected readonly displayedColumns = ['id', 'name', 'groups', 'actions'];

  protected readonly usersResource = rxResource({
    // Idle, with no rows, until an organisation is selected.
    params: () => this.orgId() ?? undefined,
    stream: ({ params: orgId }) => this.usersService.listUsers(orgId),
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
      required(path.name);
      required(path.password);
    },
    { submission: { action: async () => this.create() } },
  );

  private create(): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.createStatus.run(this.usersService.createUser(orgId, this.createForm().value()), () => {
      this.createForm().reset(NEW_USER);
      this.usersResource.reload();
    });
  }

  /** Opens the user's edit dialog, and reloads the list when it closes in case it saved. */
  protected editUser(user: User): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.dialog
      .open<OrgUserDetail, OrgUserDetailData>(OrgUserDetail, { data: { orgId, user } })
      .afterClosed()
      .subscribe(() => this.usersResource.reload());
  }

  protected deleteUser(user: User): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.deleteStatus.run(this.usersService.deleteUser(orgId, user.id), () =>
      this.usersResource.reload(),
    );
  }
}
