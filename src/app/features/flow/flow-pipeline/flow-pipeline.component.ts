import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlowService } from '../../../api/admin/api/flow.service';
import { FlowMetaDataRouter } from '../../../api/admin/model/flow-meta-data-router';
import { FlowMetaDataRouterBackend } from '../../../api/admin/model/flow-meta-data-router-backend';
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
      <div class="sections">
        <div class="section flow-section">
          <h3 class="section-heading">Flow</h3>
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
        </div>
        <div class="section backends-section">
          <h3 class="section-heading">Backends</h3>
          @if (backends().length === 0) {
            <span class="no-backends">No backends</span>
          } @else {
            <div class="backends-stack">
              @for (backend of backends(); track backend.name) {
                <div
                  class="backend-box"
                  [matTooltip]="formatBackend(backend)"
                  matTooltipClass="flow-meta-tooltip"
                >
                  {{ backend.name }}
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .sections {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      gap: 24px;
    }
    .section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .flow-section {
      flex: 1;
    }
    .backends-section {
      flex-shrink: 0;
    }
    .section-heading {
      margin: 0 0 12px 0;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--mat-sys-on-surface-variant);
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
    .backends-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .backend-box {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      background: var(--mat-sys-surface-container);
      font-weight: 500;
      cursor: default;
      white-space: nowrap;
    }
    .no-backends {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
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

  readonly backends = computed<FlowMetaDataRouterBackend[]>(() => {
    const flow = this.flowResource.value();
    if (!flow) return [];
    const router = flow.find(c => c.name === 'router');
    if (!router) return [];
    return ((router.data as unknown as FlowMetaDataRouter).backends) ?? [];
  });

  formatBackend(backend: FlowMetaDataRouterBackend): string {
    return `host: ${backend.host}\nport: ${backend.port}`;
  }

  formatData(data: unknown): string {
    if (data === null || data === undefined) return '';
    if (typeof data !== 'object' || Array.isArray(data)) return String(data);
    return this.renderObject(data as Record<string, unknown>, '');
  }

  private renderObject(obj: Record<string, unknown>, indent: string): string {
    return Object.entries(obj)
      .map(([k, v]) => this.renderEntry(k, v, indent))
      .join('\n');
  }

  private renderEntry(key: string, value: unknown, indent: string): string {
    if (value === null || value === undefined) {
      return `${indent}${key}:`;
    }
    if (typeof value !== 'object') {
      return `${indent}${key}: ${value}`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return `${indent}${key}: []`;
      const childIndent = `${indent}  `;
      return `${indent}${key}:\n${value.map(item => this.renderArrayItem(item, childIndent)).join('\n')}`;
    }
    return `${indent}${key}:\n${this.renderObject(value as Record<string, unknown>, `${indent}  `)}`;
  }

  private renderArrayItem(item: unknown, indent: string): string {
    if (item === null || item === undefined || typeof item !== 'object' || Array.isArray(item)) {
      return `${indent}- ${item ?? 'null'}`;
    }
    const entries = Object.entries(item as Record<string, unknown>);
    if (entries.length === 0) return `${indent}-`;

    return entries
      .map(([k, v], i) => {
        const prefix = i === 0 ? `${indent}- ` : `${indent}  `;
        if (v !== null && typeof v === 'object') {
          if (Array.isArray(v)) {
            if (v.length === 0) return `${prefix}${k}: []`;
            const subIndent = `${indent}    `;
            return `${prefix}${k}:\n${v.map(sub => this.renderArrayItem(sub, subIndent)).join('\n')}`;
          }
          return `${prefix}${k}:\n${this.renderObject(v as Record<string, unknown>, `${indent}    `)}`;
        }
        return `${prefix}${k}: ${v ?? 'null'}`;
      })
      .join('\n');
  }
}
