import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditDialog } from '../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../components/request-feedback/request-feedback';
import { AuthService } from '../../services/auth.service';
import { Notifier } from '../../services/notifier.service';
import { requestStatus } from '../../utils/request-status';

/** Changes the signed-in user's username. Closes, with a confirmation, once saved. */
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
  selector: 'app-change-username-dialog',
  templateUrl: './change-username-dialog.html',
})
export class ChangeUsernameDialog {
  private readonly auth = inject(AuthService);
  private readonly notifier = inject(Notifier);
  private readonly dialogRef = inject(MatDialogRef<ChangeUsernameDialog>);

  protected readonly saveStatus = requestStatus({
    failure: 'Failed to change username. Please try again.',
  });

  protected readonly form = form(
    signal({ username: this.auth.username() ?? '' }),
    (path) => required(path.username),
    { submission: { action: async () => this.save() } },
  );

  private save(): void {
    const { username } = this.form().value();
    this.saveStatus.run(this.auth.updateUsername(username), () => {
      this.notifier.show(`Username changed to ${username}`);
      this.dialogRef.close();
    });
  }
}
