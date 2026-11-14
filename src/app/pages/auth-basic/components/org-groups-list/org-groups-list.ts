import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { throwError } from 'rxjs';

import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { ListCard } from '../../../../components/list-card/list-card';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { Group, GroupsService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { requestStatus } from '../../../../utils/request-status';
import { Rename, RenamePanel } from '../rename-panel/rename-panel';

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
    RenamePanel,
  ],
  selector: 'app-org-groups-list',
  templateUrl: './org-groups-list.html',
})
export class OrgGroupsList {
  private readonly groupsService = inject(GroupsService);

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

  protected readonly renameGroup: Rename = (id, name) => {
    const orgId = this.orgId();
    if (orgId === null) {
      return throwError(() => new Error('No organisation selected'));
    }
    return this.groupsService.updateGroup(orgId, id, { id, name });
  };

  /** The group being edited. Switching organisation closes the edit panel. */
  protected readonly selectedGroup = linkedSignal<number | null, Group | null>({
    source: this.orgId,
    computation: () => null,
  });

  private create(): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.createStatus.run(this.groupsService.createGroup(orgId, this.createForm().value()), () => {
      this.createForm().reset({ name: '' });
      this.groupsResource.reload();
    });
  }

  protected onDetailSaved(): void {
    this.selectedGroup.set(null);
    this.groupsResource.reload();
  }

  protected deleteGroup(group: Group): void {
    const orgId = this.orgId();
    if (orgId === null) return;
    this.deleteStatus.run(this.groupsService.deleteGroup(orgId, group.id), () => {
      if (this.selectedGroup()?.id === group.id) {
        this.selectedGroup.set(null);
      }
      this.groupsResource.reload();
    });
  }
}
