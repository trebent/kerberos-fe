import { Component, input, linkedSignal, output } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Observable } from 'rxjs';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { requestStatus } from '../../../../utils/request-status';

/** Saves a new name for the record with the given ID. */
export type Rename = (id: number, name: string) => Observable<unknown>;

/** An edit panel for a record whose only editable field is its name: an organisation or group. */
@Component({
  imports: [
    EditPanel,
    FormField,
    FormRoot,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    RequestFeedback,
  ],
  selector: 'app-rename-panel',
  templateUrl: './rename-panel.html',
})
export class RenamePanel {
  readonly heading = input.required<string>();
  readonly item = input.required<{ id: number; name: string }>();
  readonly rename = input.required<Rename>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  /** Starts from the item's name, and again whenever another item is edited. */
  protected readonly form = form(
    linkedSignal(() => ({ name: this.item().name })),
    (path) => required(path.name),
    { submission: { action: async () => this.save() } },
  );

  private save(): void {
    const request$ = this.rename()(this.item().id, this.form().value().name);
    this.saveStatus.run(request$, () => this.saved.emit());
  }
}
