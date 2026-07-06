import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlowMeta } from '../../../api/admin/model/flow-meta';
import { FlowMetaDataRouter } from '../../../api/admin/model/flow-meta-data-router';
import { FlowMetaDataRouterBackend } from '../../../api/admin/model/flow-meta-data-router-backend';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-flow-pipeline',
  template: `
    @if (isLoading()) {
      <mat-spinner diameter="32" />
    }
    @if (hasError()) {
      <app-error-display [errors]="['Failed to load flow pipeline.']" />
    }
    @if (hasValue()) {
      <div class="flow-card">
        <div class="flow-section">
          <h3 class="section-heading">Flow</h3>
          <div class="pipeline">
            @for (comp of flowMetas()!; track comp.name; let last = $last; let i = $index) {
              <div
                class="flow-box"
                [class.involved]="hoveredBackend() !== null && !isComponentDimmed(comp.name)"
                [class.dimmed]="isComponentDimmed(comp.name)"
                [matTooltip]="formatData(comp.data)"
                matTooltipClass="flow-meta-tooltip"
              >
                {{ comp.name }}
              </div>
              @if (!last) {
                <mat-icon class="arrow" [class.dimmed]="isArrowDimmed(i)">arrow_forward</mat-icon>
              }
            }
          </div>
        </div>
        <div class="divider"></div>
        <div class="backends-section">
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
                  (mouseenter)="hoveredBackend.set(backend.name)"
                  (mouseleave)="hoveredBackend.set(null)"
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
    .flow-card {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      padding: 20px;
    }
    .flow-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-right: 20px;
    }
    .divider {
      width: 1px;
      background: var(--mat-sys-outline-variant);
      align-self: stretch;
    }
    .backends-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-left: 20px;
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
      flex: 1;
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
      background: var(--mat-sys-surface-container-high);
      font-weight: 500;
      cursor: default;
      white-space: nowrap;
      transition: opacity 200ms ease, filter 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
    }
    .flow-box.involved {
      border-color: var(--mat-sys-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--mat-sys-primary) 20%, transparent);
    }
    .flow-box.dimmed {
      opacity: 0.35;
      filter: grayscale(1);
    }
    .arrow {
      color: var(--mat-sys-outline);
      flex-shrink: 0;
      transition: opacity 200ms ease, filter 200ms ease;
    }
    .arrow.dimmed {
      opacity: 0.35;
      filter: grayscale(1);
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
      background: var(--mat-sys-surface-container-high);
      font-weight: 500;
      cursor: pointer;
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
  readonly flowMetas = input<FlowMeta[] | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly hasError = input<boolean>(false);

  readonly hasValue = computed(() => this.flowMetas() != null);

  readonly backends = computed<FlowMetaDataRouterBackend[]>(() => {
    const flow = this.flowMetas();
    if (!flow) return [];
    const router = flow.find(c => c.name === 'router');
    if (!router) return [];
    return ((router.data as unknown as FlowMetaDataRouter).backends) ?? [];
  });

  readonly hoveredBackend = signal<string | null>(null);

  private static readonly ALWAYS_INVOLVED = new Set(['observability', 'router', 'forwarder']);

  readonly involvedMap = computed<Map<string, Set<string>>>(() => {
    const flow = this.flowMetas();
    if (!flow) return new Map();

    const map = new Map<string, Set<string>>();
    for (const backend of this.backends()) {
      const involved = new Set<string>();
      for (const comp of flow) {
        if (FlowPipelineComponent.ALWAYS_INVOLVED.has(comp.name) ||
            this.hasBackendInTree(comp.data, backend.name)) {
          involved.add(comp.name);
        }
      }
      map.set(backend.name, involved);
    }
    return map;
  });

  isComponentDimmed(compName: string): boolean {
    const hovered = this.hoveredBackend();
    if (!hovered) return false;
    return !(this.involvedMap().get(hovered)?.has(compName) ?? false);
  }

  isArrowDimmed(index: number): boolean {
    const flow = this.flowMetas();
    if (!flow) return false;
    return this.isComponentDimmed(flow[index].name) || this.isComponentDimmed(flow[index + 1].name);
  }

  private hasBackendInTree(data: unknown, name: string): boolean {
    if (data === null || data === undefined || typeof data !== 'object') return false;
    if (Array.isArray(data)) {
      return data.some(item => this.hasBackendInTree(item, name));
    }
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key === 'backend' && value === name) return true;
      if (key === 'backends' && Array.isArray(value) && value.includes(name)) return true;
      if (this.hasBackendInTree(value, name)) return true;
    }
    return false;
  }

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
