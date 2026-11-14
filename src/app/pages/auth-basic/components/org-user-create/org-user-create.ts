import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { UsersService } from '../../../../services/auth-basic';
import { requestStatus } from '../../../../utils/request-status';

export interface OrgUserCreateData {
  orgId: number;
}

/**
 * Creates a user in an organisation. Open it with `MatDialog`; it closes with the new user's
 * name once created.
 */
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
  selector: 'app-org-user-create',
  templateUrl: './org-user-create.html',
})
export class OrgUserCreate {
  private readonly usersService = inject(UsersService);
  private readonly dialogRef = inject<MatDialogRef<OrgUserCreate, string>>(MatDialogRef);
  private readonly data = inject<OrgUserCreateData>(MAT_DIALOG_DATA);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create user. Please try again.',
  });

  protected readonly form = form(
    signal({ name: '', password: '' }),
    (path) => {
      required(path.name);
      required(path.password);
    },
    { submission: { action: async () => this.create() } },
  );

  private create(): void {
    const user = this.form().value();
    this.createStatus.run(this.usersService.createUser(this.data.orgId, user), () =>
      this.dialogRef.close(user.name),
    );
  }
}
