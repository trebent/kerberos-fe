import { Component, inject, input, output } from '@angular/core';
import { catchError, from, switchMap, tap, throwError } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OasService } from '../../../api/admin/api/oas.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-oas',
  templateUrl: './oas.component.html',
  styleUrl: './oas.component.scss',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
  ],
})
export class OasComponent {
  private readonly oasService = inject(OasService);

  readonly backend = input.required<string>();
  readonly closed = output<void>();

  readonly oasResource = rxResource({
    params: () => this.backend(),
    stream: ({ params: backend }) => {
      return this.oasService.getBackendOAS(backend, 'body', false, { httpHeaderAccept: 'application/yaml' }).pipe(
        switchMap(response => from((response as unknown as Blob).text())),
        catchError(err => { console.debug('[oasResource] error', err); return throwError(() => err); }),
      );
    }
  });
}
