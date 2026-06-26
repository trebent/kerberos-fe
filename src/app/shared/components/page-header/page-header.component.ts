import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header">
      @if (icon()) {
        <mat-icon class="page-header-icon">{{ icon() }}</mat-icon>
      }
      <div class="page-header-text">
        <h1 class="page-header-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header-subtitle">{{ subtitle() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .page-header-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--mat-sys-primary);
    }
    h1.page-header-title {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .page-header-subtitle {
      margin: 4px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `],
  imports: [MatIconModule],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<string>();
}
