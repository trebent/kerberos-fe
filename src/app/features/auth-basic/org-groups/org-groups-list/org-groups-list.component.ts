import { Component, effect, inject, input, signal, ViewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { GroupsService } from '../../../../api/auth-basic/api/groups.service';
import { Group } from '../../../../api/auth-basic/model/group';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { OrgGroupDetailComponent } from '../org-group-detail/org-group-detail.component';

@Component({
  selector: 'app-org-groups-list',
  templateUrl: './org-groups-list.component.html',
  styleUrl: './org-groups-list.component.scss',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    ErrorDisplayComponent,
    OrgGroupDetailComponent,
  ],
})
export class OrgGroupsListComponent {
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

  @ViewChild(MatPaginator) set paginator(value: MatPaginator) {
    this.dataSource.paginator = value ?? null;
  }

  constructor() {
    effect(() => {
      this.dataSource.data = this.groupsResource.value() ?? [];
    });
  }

  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly selectedGroup = signal<Group | null>(null, { equal: () => false });

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
    if (this.orgId() === null) return;
    if (this.selectedGroup()?.id === groupId) {
      this.selectedGroup.set(null);
    }
    this.groupsService.deleteGroup(this.orgId()!, groupId).subscribe({
      next: () => this.groupsResource.reload(),
    });
  }
}
