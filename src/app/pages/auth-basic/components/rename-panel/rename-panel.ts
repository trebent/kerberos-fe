import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
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

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => this.form.reset({ name: this.item().name }));
  }

  protected save(): void {
    if (this.form.invalid) return;
    const request$ = this.rename()(this.item().id, this.form.getRawValue().name);
    this.saveStatus.run(request$, () => this.saved.emit());
  }
}
