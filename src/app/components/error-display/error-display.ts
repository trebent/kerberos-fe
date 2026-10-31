import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Lists one or more error messages and announces them to screen readers. */
@Component({
  imports: [MatIcon],
  selector: 'app-error-display',
  styleUrl: './error-display.scss',
  templateUrl: './error-display.html',
})
export class ErrorDisplay {
  readonly errors = input.required<readonly string[]>();
}
