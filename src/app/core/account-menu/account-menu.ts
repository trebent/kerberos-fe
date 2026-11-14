import { Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

/**
 * The signed-in user's menu in the header: their own username and password, and logging out.
 * The superuser has no user record, so it can only change its password.
 */
@Component({
  imports: [MatDivider, MatIcon, MatIconButton, MatMenu, MatMenuItem, MatMenuTrigger],
  selector: 'app-account-menu',
  styleUrl: './account-menu.scss',
  templateUrl: './account-menu.html',
})
export class AccountMenu {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  protected readonly auth = inject(AuthService);

  protected readonly displayName = computed(() =>
    this.auth.isSuperuser() ? 'Superuser' : (this.auth.username() ?? ''),
  );

  // The header is on every page, so its dialogs and their forms load only when first opened.
  protected async changeUsername(): Promise<void> {
    const { ChangeUsernameDialog } =
      await import('../change-username-dialog/change-username-dialog');
    this.dialog.open(ChangeUsernameDialog);
  }

  protected async changePassword(): Promise<void> {
    const { ChangePasswordDialog } =
      await import('../change-password-dialog/change-password-dialog');
    this.dialog.open(ChangePasswordDialog);
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
