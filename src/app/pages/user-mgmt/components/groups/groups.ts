import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { confirmDelete } from '../../../../components/confirm-delete/confirm-delete';
import { ListCard } from '../../../../components/list-card/list-card';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { Group, UsersService } from '../../../../services/admin';
import { Notifier } from '../../../../services/notifier.service';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { joinNames } from '../../../../utils/names';
import { requestStatus } from '../../../../utils/request-status';
import { GroupCreate } from '../group-create/group-create';
import { GroupEdit } from '../group-edit/group-edit';

@Component({
  imports: [ListCard, RequestFeedback, ...MAT_TABLE, RowActions],
  selector: 'app-groups',
  templateUrl: './groups.html',
})
export class Groups {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly displayedColumns = ['id', 'name', 'permissions', 'actions'];

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly joinNames = joinNames;
  protected readonly dataSource = resourceDataSource(this.groupsResource);

  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete group. Please try again.',
  });

  /** The dialogs close with the saved group name, or nothing when cancelled. */
  protected addGroup(): void {
    this.dialog
      .open<GroupCreate, void, string>(GroupCreate)
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`Group ${name} created`);
        this.groupsResource.reload();
      });
  }

  protected editGroup(group: Group): void {
    this.dialog
      .open<GroupEdit, Group, string>(GroupEdit, { data: group })
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`Group ${name} updated`);
        this.groupsResource.reload();
      });
  }

  protected deleteGroup(group: Group): void {
    confirmDelete(this.dialog, `group ${group.name}`).subscribe(() =>
      this.deleteStatus.run(this.usersService.deleteGroup(group.id), () => {
        this.notifier.show(`Group ${group.name} deleted`);
        this.groupsResource.reload();
      }),
    );
  }
}
