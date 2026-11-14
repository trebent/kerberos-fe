import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';
import { provideApi as provideAdminApi } from './services/admin';
import { provideApi as provideAuthBasicApi } from './services/auth-basic';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Pages read route and query parameters as inputs, such as the selected organisation.
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([csrfInterceptor])),
    // Edit dialogs are about 32rem wide, and fill the screen on phones (see `.app-dialog`).
    // Spread the defaults, as this value replaces them rather than merging with them.
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ...new MatDialogConfig(), width: '32rem', panelClass: 'app-dialog' },
    },
    provideAdminApi({ basePath: environment.apiBaseUrl, withCredentials: true }),
    provideAuthBasicApi({ basePath: environment.apiBaseUrl, withCredentials: true }),
    provideAppInitializer(() => {
      // index.html loads Material Symbols rather than the legacy Material Icons font.
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
      // Apply the saved light/dark preference before the first render.
      inject(ThemeService);
    }),
    // Restore the session (refresh + current user) before the first navigation.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).init())),
  ],
};
