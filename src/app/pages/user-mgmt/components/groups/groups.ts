import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { CheckboxGroup } from '../../../../components/checkbox-group/checkbox-group';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { ListCard } from '../../../../components/list-card/list-card';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { Group, UsersService } from '../../../../services/admin';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { IdSelection } from '../../../../utils/id-selection';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { GroupEdit } from '../group-edit/group-edit';

@Component({
  imports: [
    CheckboxGroup,
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
    GroupEdit,
  ],
  selector: 'app-groups',
  templateUrl: './groups.html',
})
export class Groups {
  private readonly usersService = inject(UsersService);

  protected readonly displayedColumns = ['id', 'name', 'permissions', 'actions'];

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly joinNames = joinNames;
  protected readonly dataSource = resourceDataSource(this.groupsResource);

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  protected readonly createPermissions = new IdSelection();

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create group. Please try again.',
  });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete group. Please try again.',
  });
  protected readonly createForm = form(signal({ name: '' }), (path) => required(path.name), {
    submission: { action: async () => this.create() },
  });

  protected readonly selectedGroup = signal<Group | null>(null);

  private create(): void {
    const { name } = this.createForm().value();
    const permissionIDs = [...this.createPermissions.selected()];
    this.createStatus.run(this.usersService.createGroup({ name, permissionIDs }), () => {
      this.createForm().reset({ name: '' });
      this.createPermissions.set([]);
      this.groupsResource.reload();
    });
  }

  protected onDetailSaved(): void {
    this.selectedGroup.set(null);
    this.groupsResource.reload();
  }

  protected deleteGroup(group: Group): void {
    this.deleteStatus.run(this.usersService.deleteGroup(group.id), () => {
      if (this.selectedGroup()?.id === group.id) {
        this.selectedGroup.set(null);
      }
      this.groupsResource.reload();
    });
  }
}
