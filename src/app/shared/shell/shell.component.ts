import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidenavOpen = signal(true);

  readonly navSections: NavSection[] = [
    {
      heading: 'Administration',
      items: [
        { label: 'Users', icon: 'people', route: '/users' },
        { label: 'Groups', icon: 'group_work', route: '/groups' },
        { label: 'Permissions', icon: 'lock', route: '/permissions' },
        { label: 'Debug Sessions', icon: 'bug_report', route: '/debug' },
        { label: 'Flow', icon: 'account_tree', route: '/flow' },
        { label: 'Backend OAS', icon: 'description', route: '/oas' },
      ],
    },
    {
      heading: 'Auth Basic',
      items: [
        { label: 'Organisations', icon: 'domain', route: '/auth-basic/organisations' },
      ],
    },
  ];

  toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
