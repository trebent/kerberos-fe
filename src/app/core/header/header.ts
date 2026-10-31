import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../services/auth.service';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  imports: [MatButton, MatToolbar, RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly links: readonly NavLink[] = [
    { path: '/flow', label: 'Flow' },
    { path: '/user-mgmt', label: 'Users' },
    { path: '/auth-basic', label: 'Basic authentication' },
  ];

  protected logout(): void {
    const logout$: Observable<null> = this.auth.isSuperuser()
      ? this.auth.superLogout()
      : this.auth.logout();

    // Go to the login page whether or not the backend accepted the logout.
    logout$.subscribe({
      complete: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }
}
