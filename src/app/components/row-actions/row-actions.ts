import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/** The edit and delete buttons at the end of a table row. */
@Component({
  imports: [MatIcon, MatIconButton],
  selector: 'app-row-actions',
  templateUrl: './row-actions.html',
})
export class RowActions {
  /** What the row is, for the buttons' accessible names: "user alice" → "Edit user alice". */
  readonly label = input.required<string>();

  readonly edit = output<void>();
  readonly delete = output<void>();
}
