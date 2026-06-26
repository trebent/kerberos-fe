import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-display',
  template: `
    <div class="error-display" role="alert">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <div class="error-content">
        @for (msg of errors(); track msg) {
          <p class="error-message">{{ msg }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .error-display {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 4px;
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      margin-bottom: 16px;
    }
    .error-icon {
      color: var(--mat-sys-error);
      flex-shrink: 0;
    }
    .error-message {
      margin: 0;
      font: var(--mat-sys-body-medium);
    }
  `],
  imports: [MatIconModule],
})
export class ErrorDisplayComponent {
  readonly errors = input.required<string[]>();
}
