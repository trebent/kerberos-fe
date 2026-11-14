import { Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';
import { ChangeUsernameDialog } from '../change-username-dialog/change-username-dialog';

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

  protected changeUsername(): void {
    this.dialog.open(ChangeUsernameDialog);
  }

  protected changePassword(): void {
    this.dialog.open(ChangePasswordDialog);
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
