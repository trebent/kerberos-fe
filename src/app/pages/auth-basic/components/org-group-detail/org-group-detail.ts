import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, GroupsService } from '../../../../services/auth-basic';

@Component({
  host: { class: 'section-card edit-panel' },
  imports: [
    ErrorDisplay,
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
  ],
  selector: 'app-org-group-detail',
  templateUrl: './org-group-detail.html',
})
export class OrgGroupDetail {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number>();
  readonly group = input.required<Group>();

  readonly closed = output<void>();
  readonly dataChanged = output<void>();

  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      this.editForm.reset({ name: this.group().name });
    });
  }

  save(): void {
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

  close(): void {
    this.closed.emit();
  }
}
