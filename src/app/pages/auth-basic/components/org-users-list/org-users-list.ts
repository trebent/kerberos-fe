import { Component, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { of } from 'rxjs';

import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { ListCard } from '../../../../components/list-card/list-card';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { User, UsersService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { OrgUserDetail } from '../org-user-detail/org-user-detail';

@Component({
  imports: [
    ListCard,
    RequestFeedback,
    FilteredTable,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ...MAT_TABLE,
    ReactiveFormsModule,
    RowActions,
    OrgUserDetail,
  ],
  selector: 'app-org-users-list',
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

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create user. Please try again.',
  });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete user. Please try again.',
  });
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
    const orgId = this.orgId();
    if (this.createForm.invalid || orgId === null) return;
    this.createStatus.run(
      this.usersService.createUser(orgId, this.createForm.getRawValue()),
      () => {
        this.createForm.reset();
        this.usersResource.reload();
      },
    );
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
