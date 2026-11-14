import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, GroupsService } from '../../../../services/auth-basic';

@Component({
  imports: [
    EditPanel,
    ErrorDisplay,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
  ],
  selector: 'app-org-group-detail',
  styleUrl: './org-group-detail.scss',
  templateUrl: './org-group-detail.html',
})
export class OrgGroupDetail {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number>();
  readonly group = input.required<Group>();

  readonly closed = output<void>();
  readonly dataChanged = output<void>();

  protected readonly saveErrors = signal<string[]>([]);

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      this.editForm.reset({ name: this.group().name });
    });
  }

  protected save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    const g = this.group();
    this.groupsService.updateGroup(this.orgId(), g.id, { id: g.id, name }).subscribe({
      next: () => {
        this.dataChanged.emit();
        this.closed.emit();
      },
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }
}
