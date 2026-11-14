import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { switchMap } from 'rxjs';

import { CheckboxGroup } from '../../../../components/checkbox-group/checkbox-group';
import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { User, UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

/** Edits a user's name and groups. Open it with `MatDialog`; it closes with the saved name. */
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
  selector: 'app-user-edit',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject<MatDialogRef<UserEdit, string>>(MatDialogRef);
  private readonly user = inject<User>(MAT_DIALOG_DATA);

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly selectedGroups = new IdSelection(() =>
    (this.user.groups ?? []).map((g) => g.id),
  );
  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  protected readonly editForm = form(
    signal({ username: this.user.username }),
    (path) => required(path.username),
    { submission: { action: async () => this.save() } },
  );

  /** Saves the username, then the group membership. */
  private save(): void {
    const userId = this.user.id;
    const groupIDs = [...this.selectedGroups.selected()];
    const { username } = this.editForm().value();
    const request$ = this.usersService
      .updateUser(userId, { username })
      .pipe(switchMap(() => this.usersService.updateUserGroups(userId, { groupIDs })));
    this.saveStatus.run(request$, () => this.dialogRef.close(username));
  }
}
