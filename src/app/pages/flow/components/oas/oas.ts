import { Component, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { from, switchMap } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { OasService } from '../../../../services/admin';

/** Shows the OpenAPI specification Kerberos validates a backend's requests against. */
@Component({
  imports: [ErrorDisplay, MatIcon, MatIconButton, MatProgressSpinner],
  selector: 'app-oas',
  styleUrl: './oas.scss',
  templateUrl: './oas.html',
})
export class Oas {
  private readonly oasService = inject(OasService);

  readonly backend = input.required<string>();
  readonly closed = output<void>();

  protected readonly oasResource = rxResource({
    params: () => this.backend(),
    stream: ({ params: backend }) =>
      this.oasService
        .getBackendOAS(backend, 'body', false, { httpHeaderAccept: 'application/yaml' })
        .pipe(switchMap((response) => from((response as unknown as Blob).text()))),
  });
}
