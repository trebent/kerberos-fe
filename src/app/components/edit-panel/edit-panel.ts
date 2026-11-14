import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/**
 * The panel a list card opens under its table to edit the selected row: a heading, a close
 * button and the projected form.
 */
@Component({
  imports: [MatIcon, MatIconButton],
  selector: 'app-edit-panel',
  styleUrl: './edit-panel.scss',
  templateUrl: './edit-panel.html',
})
export class EditPanel {
  readonly heading = input.required<string>();

  readonly closed = output<void>();
}
