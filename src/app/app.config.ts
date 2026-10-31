import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { csrfInterceptor } from './interceptors/csrf.interceptor';
import { provideApi as provideAdminApi } from './services/admin';
import { provideApi as provideAuthBasicApi } from './services/auth-basic';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([csrfInterceptor])),
    provideAdminApi({ basePath: environment.apiBaseUrl, withCredentials: true }),
    provideAuthBasicApi({ basePath: environment.apiBaseUrl, withCredentials: true }),
    provideAppInitializer(() => {
      // index.html loads Material Symbols rather than the legacy Material Icons font.
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
    // Restore the session (refresh + current user) before the first navigation.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).init())),
  ],
};
