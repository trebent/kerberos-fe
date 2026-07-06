import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-display',
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
  imports: [MatIconModule],
})
export class ErrorDisplayComponent {
  readonly errors = input.required<string[]>();
}
