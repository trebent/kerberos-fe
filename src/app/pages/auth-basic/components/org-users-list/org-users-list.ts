import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
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
import { OrgUserDetail } from '../org-user-detail/org-user-detail';

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
    OrgUserDetail,
  ],
  selector: 'app-org-users-list',
  templateUrl: './org-users-list.html',
})
export class OrgUsersList {
  private readonly usersService = inject(UsersService);

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

  /** The user being edited. Switching organisation closes the edit panel. */
  protected readonly selectedUser = linkedSignal<number | null, User | null>({
    source: this.orgId,
    computation: () => null,
  });

  private create(): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.createStatus.run(this.usersService.createUser(orgId, this.createForm().value()), () => {
      this.createForm().reset(NEW_USER);
      this.usersResource.reload();
    });
  }

  protected deleteUser(user: User): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.deleteStatus.run(this.usersService.deleteUser(orgId, user.id), () => {
      if (this.selectedUser()?.id === user.id) {
        this.selectedUser.set(null);
      }
      this.usersResource.reload();
    });
  }
}
