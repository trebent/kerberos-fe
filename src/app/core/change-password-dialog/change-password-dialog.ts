import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { EditDialog } from '../../components/edit-dialog/edit-dialog';
import { ChangePassword, PasswordChange } from '../../components/password-change/password-change';
import { AuthService } from '../../services/auth.service';
import { Notifier } from '../../services/notifier.service';

/** Changes the signed-in user's own password. Closes, with a confirmation, once changed. */
@Component({
  imports: [EditDialog, PasswordChange],
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.html',
})
export class ChangePasswordDialog {
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialog>);

  protected readonly change: ChangePassword = (oldPassword, newPassword) =>
    this.auth.changeOwnPassword(oldPassword, newPassword);

  protected close(): void {
    this.notifier.show('Password changed');
    this.dialogRef.close();
  }
}
