import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { sessionInterceptor } from './core/interceptors/session.interceptor';
import { environment } from '../environments/environment';
import { provideApi as provideAdminAPI } from './api/admin/provide-api';
import { provideApi as provideAuthBasicAPI } from './api/auth-basic/provide-api';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAdminAPI(environment.apiBaseUrl),
    provideAuthBasicAPI(environment.apiBaseUrl),
    provideHttpClient(withInterceptors([sessionInterceptor])),
  ],
};
