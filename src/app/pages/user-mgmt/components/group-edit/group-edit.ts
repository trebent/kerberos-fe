import { Component, effect, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { Group, UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

@Component({
  imports: [
    RequestFeedback,
    EditPanel,
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
  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

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
    const { name } = this.editForm.getRawValue();
    const permissionIDs = [...this.selectedPermissions.selected()];
    const request$ = this.usersService.updateGroup(this.group().id, { name, permissionIDs });
    this.saveStatus.run(request$, () => this.saved.emit());
  }
}
