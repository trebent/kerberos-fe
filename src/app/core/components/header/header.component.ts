import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  template: `
    <mat-toolbar class="app-header">
      <span class="brand">Kerberos</span>

      @if (authService.isLoggedIn()) {
        <nav class="nav-links">
          <a mat-button routerLink="/flow" routerLinkActive="active-nav-link">Flow</a>
          <a mat-button routerLink="/user-mgmt" routerLinkActive="active-nav-link">User Mgmt</a>
          <a mat-button routerLink="/auth-basic" routerLinkActive="active-nav-link">Basic Authentication</a>
        </nav>
      }

      <span class="spacer"></span>

      @if (authService.isLoggedIn()) {
        <span class="user-info">Logged in as {{ authService.username() }}</span>
        <button mat-stroked-button (click)="logout()">Logout</button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: var(--mat-sys-surface-container);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      gap: 8px;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
      margin-right: 16px;
      white-space: nowrap;
    }
    .nav-links {
      display: flex;
      gap: 4px;
    }
    .spacer {
      flex: 1;
    }
    .user-info {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      margin-right: 8px;
      white-space: nowrap;
    }
    ::ng-deep .active-nav-link {
      background-color: var(--mat-sys-secondary-container) !important;
      color: var(--mat-sys-on-secondary-container) !important;
    }
  `],
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
  ],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  logout(): void {
    if (this.authService.isSuperuser()) {
      this.authService.superLogout().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error: Error) => {
          console.error(error);
        },
      });
    } else {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error: Error) => {
          console.error(error);
        },
      });
    }
  }
}
