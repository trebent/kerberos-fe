import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable } from 'rxjs';

import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { requestStatus } from '../../../../utils/request-status';

export interface NameDialogData {
  heading: string;
  /** The submit button's text, such as "Create" or "Save". */
  submitLabel: string;
  /** The current name; empty for a new record. */
  name: string;
  /** Sends the name: creates or renames the record. */
  save: (name: string) => Observable<unknown>;
}

/**
 * Creates or renames a record whose only field is its name: a group, or an organisation's
 * rename. Open it with `MatDialog`; it closes with the saved name.
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
  selector: 'app-name-dialog',
  templateUrl: './name-dialog.html',
})
export class NameDialog {
  private readonly dialogRef = inject<MatDialogRef<NameDialog, string>>(MatDialogRef);
  protected readonly data = inject<NameDialogData>(MAT_DIALOG_DATA);

  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  protected readonly form = form(signal({ name: this.data.name }), (path) => required(path.name), {
    submission: { action: async () => this.save() },
  });

  private save(): void {
    const { name } = this.form().value();
    this.saveStatus.run(this.data.save(name), () => this.dialogRef.close(name));
  }
}
