import { Component, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Group, UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';

@Component({
  imports: [
    EditPanel,
    ErrorDisplay,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ReactiveFormsModule,
  ],
  selector: 'app-group-edit',
  styleUrl: './group-edit.scss',
  templateUrl: './group-edit.html',
})
export class GroupEdit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly group = input.required<Group>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  protected readonly selectedPermissions = new IdSelection();
  protected readonly saveErrors = signal<string[]>([]);

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const group = this.group();
      this.editForm.reset({ name: group.name });
      // Not every endpoint includes a group's permissions.
      this.selectedPermissions.set((group.permissions ?? []).map((p) => p.id));
    });
  }

  protected save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    this.usersService
      .updateGroup(this.group().id, {
        name,
        permissionIDs: [...this.selectedPermissions.selected()],
      })
      .subscribe({
        next: () => this.saved.emit(),
        error: () => this.saveErrors.set(['Failed to save. Please try again.']),
      });
  }
}
