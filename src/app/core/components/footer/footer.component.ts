import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <span>Kerberos</span>
    </footer>
  `,
  styles: [`
    .app-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      padding: 0 24px;
      background-color: var(--mat-sys-surface-container-low);
      border-top: 1px solid var(--mat-sys-outline-variant);
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `],
})
export class FooterComponent {}
