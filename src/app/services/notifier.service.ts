import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** One place for transient confirmations, so every page shows them the same way. */
@Service()
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    // Long enough to read; the snack bar also announces it to screen readers.
    this.snackBar.open(message, 'Dismiss', { duration: 6000 });
  }
}
