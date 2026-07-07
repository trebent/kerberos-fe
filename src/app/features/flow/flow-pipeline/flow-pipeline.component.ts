import { DatePipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DebugSessionCall } from '../../../api/admin/model/debug-session-call';
import { FlowMeta } from '../../../api/admin/model/flow-meta';
import { FlowMetaDataRouter } from '../../../api/admin/model/flow-meta-data-router';
import { FlowMetaDataRouterBackend } from '../../../api/admin/model/flow-meta-data-router-backend';
import { FlowTransition } from '../../../api/admin/model/flow-transition';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-flow-pipeline',
  templateUrl: './flow-pipeline.component.html',
  styleUrl: './flow-pipeline.component.scss',
  imports: [
    DatePipe,
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
  readonly selectedCall = input<DebugSessionCall | null>(null);

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

  readonly transitionsByComponent = computed<Map<string, { inbound: FlowTransition[], outbound: FlowTransition[] }>>(() => {
    const call = this.selectedCall();
    const map = new Map<string, { inbound: FlowTransition[], outbound: FlowTransition[] }>();
    if (!call) return map;

    for (const t of call.flowTransitions) {
      if (!map.has(t.component)) {
        map.set(t.component, { inbound: [], outbound: [] });
      }
      const entry = map.get(t.component)!;
      if (t.direction === FlowTransition.DirectionEnum.Inbound) {
        entry.inbound.push(t);
      } else {
        entry.outbound.push(t);
      }
    }
    return map;
  });

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

  getTransitions(compName: string, direction: 'inbound' | 'outbound'): FlowTransition[] {
    const entry = this.transitionsByComponent().get(compName);
    return entry ? entry[direction] : [];
  }

  formatTransitionTooltip(t: FlowTransition): string {
    const fmt = (iso: string) => new Date(iso).toLocaleString();
    const lines = [
      `Started:  ${fmt(t.startedAt)}`,
      `Stopped:  ${fmt(t.stoppedAt)}`,
    ];
    if (t.result.outcome === 'failure' && t.result.cause) {
      lines.push(`Error:    ${t.result.cause}`);
    }
    return lines.join('\n');
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
