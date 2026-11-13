import { Component, effect, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, GroupsService } from '../../../../services/auth-basic';
import { MAT_TABLE } from '../../../../utils/material-table';
import { OrgGroupDetail } from '../org-group-detail/org-group-detail';

@Component({
  host: { class: 'section-card' },
  imports: [
    ErrorDisplay,
    MatButton,
    MatDivider,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatPaginator,
    MatProgressSpinner,
    ...MAT_TABLE,
    ReactiveFormsModule,
    OrgGroupDetail,
  ],
  selector: 'app-org-groups-list',
  templateUrl: './org-groups-list.html',
})
export class OrgGroupsList {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  readonly displayedColumns = ['id', 'name', 'actions'];

  readonly groupsResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<Group[]>([]);
      }
      return this.groupsService.listGroups(orgId);
    },
  });

  readonly dataSource = new MatTableDataSource<Group>();

  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    // The paginator only exists once the table is rendered.
    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });

    effect(() => {
      this.dataSource.data = this.groupsResource.value() ?? [];
    });
  }

  readonly createErrors = signal<string[]>([]);
  readonly deleteErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  /** The group being edited. Switching organisation closes the edit panel. */
  readonly selectedGroup = linkedSignal<number | null, Group | null>({
    source: this.orgId,
    computation: () => null,
    equal: () => false,
  });

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  submitCreate(): void {
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

  openEdit(group: Group): void {
    this.selectedGroup.set(group);
  }

  onDataChanged(): void {
    this.groupsResource.reload();
  }

  onDetailClosed(): void {
    this.selectedGroup.set(null);
  }

  deleteGroup(groupId: number): void {
    const orgId = this.orgId();
    if (orgId === null) return;

    this.deleteErrors.set([]);
    this.groupsService.deleteGroup(orgId, groupId).subscribe({
      next: () => {
        if (this.selectedGroup()?.id === groupId) {
          this.selectedGroup.set(null);
        }
        this.groupsResource.reload();
      },
      error: () => this.deleteErrors.set(['Failed to delete group. Please try again.']),
    });
  }
}
