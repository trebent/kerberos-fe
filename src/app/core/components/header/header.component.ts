import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
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
