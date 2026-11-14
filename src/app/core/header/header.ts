import { Component, computed, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ThemeMode, ThemeService } from '../../services/theme.service';
import { AccountMenu } from '../account-menu/account-menu';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: string;
}

@Component({
  imports: [
    AccountMenu,
    MatButton,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatToolbar,
    RouterLink,
    RouterLinkActive,
  ],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  protected readonly links: readonly NavLink[] = [
    { path: '/flow', label: 'Flow', icon: 'account_tree' },
    { path: '/user-mgmt', label: 'Users', icon: 'group' },
    { path: '/auth-basic', label: 'Basic authentication', icon: 'key' },
  ];

  protected readonly themeOptions: readonly ThemeOption[] = [
    { mode: 'system', label: 'System', icon: 'brightness_auto' },
    { mode: 'light', label: 'Light', icon: 'light_mode' },
    { mode: 'dark', label: 'Dark', icon: 'dark_mode' },
  ];

  protected readonly currentTheme = computed(
    () =>
      this.themeOptions.find((option) => option.mode === this.theme.mode()) ?? this.themeOptions[0],
  );
}
