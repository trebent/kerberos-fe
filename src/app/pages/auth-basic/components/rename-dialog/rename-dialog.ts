import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable } from 'rxjs';

import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { requestStatus } from '../../../../utils/request-status';

export interface RenameDialogData {
  heading: string;
  /** The current name. */
  name: string;
  /** Saves the new name. */
  rename: (name: string) => Observable<unknown>;
}

/**
 * Renames a record whose only editable field is its name: an organisation or a group. Open it
 * with `MatDialog`; it closes with `true` once saved.
 */
@Component({
  imports: [
    EditDialog,
    FormField,
    FormRoot,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    RequestFeedback,
  ],
  selector: 'app-rename-dialog',
  templateUrl: './rename-dialog.html',
})
export class RenameDialog {
  private readonly dialogRef = inject<MatDialogRef<RenameDialog, boolean>>(MatDialogRef);
  protected readonly data = inject<RenameDialogData>(MAT_DIALOG_DATA);

  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  protected readonly form = form(signal({ name: this.data.name }), (path) => required(path.name), {
    submission: { action: async () => this.save() },
  });

  private save(): void {
    const request$ = this.data.rename(this.form().value().name);
    this.saveStatus.run(request$, () => this.dialogRef.close(true));
  }
}
