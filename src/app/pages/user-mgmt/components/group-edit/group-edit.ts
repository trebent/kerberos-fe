import { Component, effect, inject, input, linkedSignal, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
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
    EditPanel,
    FormField,
    FormRoot,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    RequestFeedback,
  ],
  selector: 'app-group-edit',
  templateUrl: './group-edit.html',
})
export class GroupEdit {
  private readonly usersService = inject(UsersService);

  readonly group = input.required<Group>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  protected readonly selectedPermissions = new IdSelection();
  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  protected readonly editForm = form(
    linkedSignal(() => ({ name: this.group().name })),
    (path) => required(path.name),
    { submission: { action: async () => this.save() } },
  );

  constructor() {
    // Not every endpoint includes a group's permissions.
    effect(() => this.selectedPermissions.set((this.group().permissions ?? []).map((p) => p.id)));
  }

  private save(): void {
    const { name } = this.editForm().value();
    const permissionIDs = [...this.selectedPermissions.selected()];
    const request$ = this.usersService.updateGroup(this.group().id, { name, permissionIDs });
    this.saveStatus.run(request$, () => this.saved.emit());
  }
}
