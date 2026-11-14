import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { of } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { FilteredTable } from '../../../../components/filtered-table/filtered-table';
import { RowActions } from '../../../../components/row-actions/row-actions';
import { Group, GroupsService } from '../../../../services/auth-basic';
import { MAT_TABLE, resourceDataSource } from '../../../../utils/material-table';
import { OrgGroupDetail } from '../org-group-detail/org-group-detail';

@Component({
  imports: [
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
  styleUrl: './org-groups-list.scss',
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

  protected readonly createErrors = signal<string[]>([]);
  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  /** The group being edited. Switching organisation closes the edit panel. */
  protected readonly selectedGroup = linkedSignal<number | null, Group | null>({
    source: this.orgId,
    computation: () => null,
  });

  protected submitCreate(): void {
    if (this.createForm.invalid || this.orgId() === null) return;
    this.createErrors.set([]);
    const { name } = this.createForm.getRawValue();
    this.groupsService.createGroup(this.orgId()!, { name }).subscribe({
      next: () => {
        this.createForm.reset();
        this.groupsResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create group. Please try again.']);
      },
    });
  }

  protected onDataChanged(): void {
    this.groupsResource.reload();
  }

  protected deleteGroup(groupId: number): void {
    if (this.orgId() === null) return;
    if (this.selectedGroup()?.id === groupId) {
      this.selectedGroup.set(null);
    }
    this.groupsService.deleteGroup(this.orgId()!, groupId).subscribe({
      next: () => this.groupsResource.reload(),
    });
  }
}
