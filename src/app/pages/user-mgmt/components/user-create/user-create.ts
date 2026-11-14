import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { UsersService } from '../../../../services/admin';
import { requestStatus } from '../../../../utils/request-status';

/** Creates a user. Open it with `MatDialog`; it closes with the new username once created. */
@Component({
  imports: [
    EditDialog,
    FormField,
    FormRoot,
    MatButton,
    MatDialogClose,
    MatFormField,
    MatInput,
    MatLabel,
    RequestFeedback,
  ],
  selector: 'app-user-create',
  templateUrl: './user-create.html',
})
export class UserCreate {
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject<MatDialogRef<UserCreate, string>>(MatDialogRef);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create user. Please try again.',
  });

  protected readonly form = form(
    signal({ username: '', password: '' }),
    (path) => {
      required(path.username);
      required(path.password);
    },
    { submission: { action: async () => this.create() } },
  );

  private create(): void {
    const user = this.form().value();
    this.createStatus.run(this.usersService.createUser(user), () =>
      this.dialogRef.close(user.username),
    );
  }
}
