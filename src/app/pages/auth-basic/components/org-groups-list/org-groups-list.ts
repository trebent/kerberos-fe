import { Component, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { of } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { Group, GroupsService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { requestStatus } from '../../../../utils/request-status';
import { OrgGroupDetail } from '../org-group-detail/org-group-detail';

@Component({
  host: { class: 'section-card' },
  imports: [
    RequestFeedback,
    ErrorDisplay,
    FilteredTable,
    MatButton,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ...MAT_TABLE,
    ReactiveFormsModule,
    RowActions,
    OrgGroupDetail,
  ],
  selector: 'app-org-groups-list',
  templateUrl: './org-groups-list.html',
})
export class OrgGroupsList {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  protected readonly displayedColumns = ['id', 'name', 'actions'];

  protected readonly groupsResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<Group[]>([]);
      }
      return this.groupsService.listGroups(orgId);
    },
  });

  protected readonly dataSource = resourceDataSource(this.groupsResource);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create group. Please try again.',
  });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete group. Please try again.',
  });
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  /** The group being edited. Switching organisation closes the edit panel. */
  protected readonly selectedGroup = linkedSignal<number | null, Group | null>({
    source: this.orgId,
    computation: () => null,
  });

  protected submitCreate(): void {
    const orgId = this.orgId();
    if (this.createForm.invalid || orgId === null) return;
    this.createStatus.run(
      this.groupsService.createGroup(orgId, this.createForm.getRawValue()),
      () => {
        this.createForm.reset();
        this.groupsResource.reload();
      },
    );
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
