import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { CheckboxGroup } from '../../../../components/checkbox-group/checkbox-group';
import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { Group, UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

/** Edits a group's name and permissions. Open it with `MatDialog`; it closes with the saved name. */
@Component({
  imports: [
    CheckboxGroup,
    EditDialog,
    ErrorDisplay,
    FormField,
    FormRoot,
    MatButton,
    MatDialogClose,
    MatFormField,
    MatInput,
    MatLabel,
    RequestFeedback,
  ],
  selector: 'app-group-edit',
  templateUrl: './group-edit.html',
})
export class GroupEdit {
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject<MatDialogRef<GroupEdit, string>>(MatDialogRef);
  private readonly group = inject<Group>(MAT_DIALOG_DATA);

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  // Not every endpoint includes a group's permissions.
  protected readonly selectedPermissions = new IdSelection(() =>
    (this.group.permissions ?? []).map((p) => p.id),
  );
  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  protected readonly editForm = form(
    signal({ name: this.group.name }),
    (path) => required(path.name),
    { submission: { action: async () => this.save() } },
  );

  private save(): void {
    const { name } = this.editForm().value();
    const permissionIDs = [...this.selectedPermissions.selected()];
    const request$ = this.usersService.updateGroup(this.group.id, { name, permissionIDs });
    this.saveStatus.run(request$, () => this.dialogRef.close(name));
  }
}
