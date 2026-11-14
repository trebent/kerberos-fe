import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { filter, map, Observable } from 'rxjs';

export interface ConfirmDeleteData {
  /** What is deleted, such as "user alice". */
  what: string;
}

/** Asks before a record is deleted. Open it with {@link confirmDelete}. */
@Component({
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.html',
})
export class ConfirmDelete {
  protected readonly data = inject<ConfirmDeleteData>(MAT_DIALOG_DATA);
}

/**
 * Asks whether to delete `what` ("user alice"), and emits once if the user confirms. Unlike the
 * edit dialogs it stays a small dialog on phones, so it replaces the default panel class.
 */
export function confirmDelete(dialog: MatDialog, what: string): Observable<void> {
  return dialog
    .open<ConfirmDelete, ConfirmDeleteData, boolean>(ConfirmDelete, {
      data: { what },
      width: '24rem',
      panelClass: 'confirm-dialog',
    })
    .afterClosed()
    .pipe(
      filter(Boolean),
      map(() => undefined),
    );
}
