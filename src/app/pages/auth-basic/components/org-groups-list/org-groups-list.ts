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
import { Group, GroupsService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { requestStatus } from '../../../../utils/request-status';
import { RenameDialog, RenameDialogData } from '../rename-dialog/rename-dialog';

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
  selector: 'app-org-groups-list',
  templateUrl: './org-groups-list.html',
})
export class OrgGroupsList {
  private readonly groupsService = inject(GroupsService);
  private readonly dialog = inject(MatDialog);

  readonly orgId = input.required<number | null>();

  protected readonly displayedColumns = ['id', 'name', 'actions'];

  protected readonly groupsResource = rxResource({
    // Idle, with no rows, until an organisation is selected.
    params: () => this.orgId() ?? undefined,
    stream: ({ params: orgId }) => this.groupsService.listGroups(orgId),
  });

  protected readonly dataSource = resourceDataSource(this.groupsResource);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create group. Please try again.',
  });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete group. Please try again.',
  });
  protected readonly createForm = form(signal({ name: '' }), (path) => required(path.name), {
    submission: { action: async () => this.create() },
  });

  private create(): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.createStatus.run(this.groupsService.createGroup(orgId, this.createForm().value()), () => {
      this.createForm().reset({ name: '' });
      this.groupsResource.reload();
    });
  }

  protected renameGroup(group: Group): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    const data: RenameDialogData = {
      heading: 'Edit group',
      name: group.name,
      rename: (name) => this.groupsService.updateGroup(orgId, group.id, { id: group.id, name }),
    };
    this.dialog
      .open<RenameDialog, RenameDialogData, boolean>(RenameDialog, { data })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.groupsResource.reload();
      });
  }

  protected deleteGroup(group: Group): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.deleteStatus.run(this.groupsService.deleteGroup(orgId, group.id), () =>
      this.groupsResource.reload(),
    );
  }
}
