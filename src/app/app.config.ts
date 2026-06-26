import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { sessionInterceptor } from './core/interceptors/session.interceptor';
import { BASE_PATH as ADMIN_BASE_PATH } from './api/admin/variables';
import { BASE_PATH as AUTH_BASIC_BASE_PATH } from './api/auth-basic/variables';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([sessionInterceptor])),
    { provide: ADMIN_BASE_PATH, useValue: environment.apiBaseUrl },
    { provide: AUTH_BASIC_BASE_PATH, useValue: environment.apiBaseUrl },
  ],
};
