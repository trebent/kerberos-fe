import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { confirmDelete } from '../../../../components/confirm-delete/confirm-delete';
import { ListCard } from '../../../../components/list-card/list-card';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { Group, GroupsService } from '../../../../services/auth-basic';
import { Notifier } from '../../../../services/notifier.service';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { requestStatus } from '../../../../utils/request-status';
import { NameDialog, NameDialogData } from '../name-dialog/name-dialog';

/** The groups of one organisation. A group has only a name, so one dialog adds and renames. */
@Component({
  imports: [ListCard, RequestFeedback, ...MAT_TABLE, RowActions],
  selector: 'app-org-groups-list',
  templateUrl: './org-groups-list.html',
})
export class OrgGroupsList {
  private readonly groupsService = inject(GroupsService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  readonly orgId = input.required<number>();

  protected readonly displayedColumns = ['id', 'name', 'actions'];

  protected readonly groupsResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => this.groupsService.listGroups(orgId),
  });

  protected readonly dataSource = resourceDataSource(this.groupsResource);

  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete group. Please try again.',
  });

  /** The dialog closes with the saved name, or nothing when cancelled. */
  protected addGroup(): void {
    const orgId = this.orgId();
    const data: NameDialogData = {
      heading: 'Add group',
      submitLabel: 'Create',
      name: '',
      save: (name) => this.groupsService.createGroup(orgId, { name }),
    };
    this.dialog
      .open<NameDialog, NameDialogData, string>(NameDialog, { data })
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`Group ${name} created`);
        this.groupsResource.reload();
      });
  }

  protected renameGroup(group: Group): void {
    const orgId = this.orgId();
    const data: NameDialogData = {
      heading: 'Edit group',
      submitLabel: 'Save',
      name: group.name,
      save: (name) => this.groupsService.updateGroup(orgId, group.id, { id: group.id, name }),
    };
    this.dialog
      .open<NameDialog, NameDialogData, string>(NameDialog, { data })
      .afterClosed()
      .subscribe((name) => {
        if (name === undefined) return;
        this.notifier.show(`Group ${name} updated`);
        this.groupsResource.reload();
      });
  }

  protected deleteGroup(group: Group): void {
    confirmDelete(this.dialog, `group ${group.name}`).subscribe(() =>
      this.deleteStatus.run(this.groupsService.deleteGroup(this.orgId(), group.id), () => {
        this.notifier.show(`Group ${group.name} deleted`);
        this.groupsResource.reload();
      }),
    );
  }
}
