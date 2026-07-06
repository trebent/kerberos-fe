import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlowService } from '../../../api/admin/api/flow.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-flow-pipeline',
  template: `
    @if (flowResource.isLoading()) {
      <mat-spinner diameter="32" />
    }
    @if (flowResource.error()) {
      <app-error-display [errors]="['Failed to load flow pipeline.']" />
    }
    @if (flowResource.hasValue()) {
      <div class="pipeline">
        @for (comp of flowResource.value()!; track comp.name; let last = $last) {
          <div
            class="flow-box"
            [matTooltip]="formatData(comp.data)"
            matTooltipClass="flow-meta-tooltip"
          >
            {{ comp.name }}
          </div>
          @if (!last) {
            <mat-icon class="arrow">arrow_forward</mat-icon>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .pipeline {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .flow-box {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      background: var(--mat-sys-surface-container);
      font-weight: 500;
      cursor: default;
      white-space: nowrap;
    }
    .arrow {
      color: var(--mat-sys-outline);
      flex-shrink: 0;
    }
  `],
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ErrorDisplayComponent,
  ],
})
export class FlowPipelineComponent {
  private readonly flowService = inject(FlowService);

  readonly flowResource = rxResource({
    stream: () => this.flowService.getFlow(),
  });

  formatData(data: unknown): string {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return String(data ?? '');
    }
    return Object.entries(data as Record<string, unknown>)
      .map(([k, v]) => {
        const val =
          typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
        return `${k}: ${val}`;
      })
      .join('\n');
  }
}
