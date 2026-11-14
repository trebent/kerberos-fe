import { Component, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { from, switchMap } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Skeleton } from '../../../../components/skeleton/skeleton';
import { OasService } from '../../../../services/admin';

/** Shows the OpenAPI specification Kerberos validates a backend's requests against. */
@Component({
  host: { class: 'section-card' },
  imports: [ErrorDisplay, MatIcon, MatIconButton, Skeleton],
  selector: 'app-oas',
  styleUrl: './oas.scss',
  templateUrl: './oas.html',
})
export class Oas {
  private readonly oasService = inject(OasService);

  readonly backend = input.required<string>();
  readonly closed = output<void>();

  protected readonly skeletonLines = [
    { width: '6rem', indent: '0' },
    { width: '9rem', indent: '1rem' },
    { width: '12rem', indent: '1rem' },
    { width: '5rem', indent: '0' },
    { width: '8rem', indent: '1rem' },
    { width: '14rem', indent: '2rem' },
    { width: '10rem', indent: '2rem' },
    { width: '7rem', indent: '1rem' },
  ];

  protected readonly oasResource = rxResource({
    params: () => this.backend(),
    stream: ({ params: backend }) =>
      this.oasService
        .getBackendOAS(backend, 'body', false, { httpHeaderAccept: 'application/yaml' })
        .pipe(switchMap((response) => from((response as unknown as Blob).text()))),
  });
}
