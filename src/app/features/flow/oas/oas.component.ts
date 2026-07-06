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
  template: `
    <div class="oas-header">
      <span class="oas-title">{{ backend() }}</span>
      <button mat-icon-button (click)="closed.emit()" aria-label="Close OAS viewer">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div class="oas-body">
      @if (oasResource.isLoading()) {
        <div class="oas-loading">
          <mat-spinner diameter="32" />
        </div>
      }
      @if (oasResource.error() && !oasResource.isLoading()) {
        <app-error-display [errors]="['Failed to load OAS spec.']" />
      }
      @if (oasResource.hasValue()) {
        <pre class="oas-pre">{{ oasResource.value() }}</pre>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }
    .oas-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 8px 8px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      flex-shrink: 0;
    }
    .oas-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
    }
    .oas-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
    .oas-loading {
      display: flex;
      justify-content: center;
      padding: 32px;
    }
    .oas-pre {
      margin: 0;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 0.8rem;
      line-height: 1.5;
      white-space: pre;
      color: var(--mat-sys-on-surface);
    }
  `],
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
        tap(response => console.debug('[oasResource] raw response', response)),
        switchMap(response => from((response as unknown as Blob).text())),
        tap(text => console.debug('[oasResource] parsed text', text)),
        catchError(err => { console.debug('[oasResource] error', err); return throwError(() => err); }),
      );
    }
  });
}
