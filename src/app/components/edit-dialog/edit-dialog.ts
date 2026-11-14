import { Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

/**
 * The layout of an edit dialog: a title, a close button and the projected forms, which scroll
 * when they do not fit. Use it as the template root of a component opened with `MatDialog`.
 */
@Component({
  imports: [MatDialogClose, MatDialogTitle, MatIcon, MatIconButton],
  selector: 'app-edit-dialog',
  styleUrl: './edit-dialog.scss',
  templateUrl: './edit-dialog.html',
})
export class EditDialog {
  readonly heading = input.required<string>();
}
