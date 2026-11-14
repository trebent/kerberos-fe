import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { CheckboxGroup } from '../../../../components/checkbox-group/checkbox-group';
import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

/** Creates a group with the ticked permissions. Closes with the new group's name once created. */
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
  selector: 'app-group-create',
  templateUrl: './group-create.html',
})
export class GroupCreate {
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject<MatDialogRef<GroupCreate, string>>(MatDialogRef);

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });
  protected readonly selectedPermissions = new IdSelection();

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create group. Please try again.',
  });

  protected readonly form = form(signal({ name: '' }), (path) => required(path.name), {
    submission: { action: async () => this.create() },
  });

  private create(): void {
    const { name } = this.form().value();
    const permissionIDs = [...this.selectedPermissions.selected()];
    this.createStatus.run(this.usersService.createGroup({ name, permissionIDs }), () =>
      this.dialogRef.close(name),
    );
  }
}
