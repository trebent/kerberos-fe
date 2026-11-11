import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import {
  DebugSessionCall,
  FlowMeta,
  FlowMetaDataRouter,
  FlowMetaDataRouterBackend,
  FlowTransition,
} from '../../../../services/admin';

@Component({
  imports: [DatePipe, MatIcon, MatTooltip],
  host: { '[class.vertical]': 'vertical()' },
  selector: 'app-flow-pipeline',
  styleUrl: './flow-pipeline.scss',
  templateUrl: './flow-pipeline.html',
})
export class FlowPipeline {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  readonly flowMetas = input.required<FlowMeta[]>();
  readonly selectedCall = input<DebugSessionCall | null>(null);
  readonly callBackend = input<string | null>(null);

  readonly backends = computed<FlowMetaDataRouterBackend[]>(() => {
    const router = this.flowMetas().find((c) => c.name === 'router');
    if (!router) return [];
    return (router.data as unknown as FlowMetaDataRouter).backends ?? [];
  });

  readonly hoveredBackend = signal<string | null>(null);

  /** Runs the pipeline top to bottom because it does not fit across the available width. */
  protected readonly vertical = signal(false);
  /** The width of the host, kept up to date while the page is resized or panels open. */
  private readonly availableWidth = signal(0);
  /** The width the pipeline needed the last time it was laid out horizontally. */
  private horizontalWidth = 0;

  readonly effectiveBackend = computed<string | null>(
    () => this.callBackend() ?? this.hoveredBackend(),
  );

  constructor() {
    this.watchAvailableWidth();

    // New content changes the width a horizontal pipeline needs, so lay it out horizontally
    // again and measure it. Both layout passes happen before the browser paints.
    effect(() => {
      this.flowMetas();
      this.selectedCall();
      untracked(() => this.vertical.set(false));
    });

    afterRenderEffect({
      earlyRead: () => {
        this.flowMetas();
        this.selectedCall();
        const available = this.availableWidth();

        if (this.vertical()) {
          return available < this.horizontalWidth;
        }

        const card = this.card().nativeElement;
        const border = card.offsetWidth - card.clientWidth;
        this.horizontalWidth = card.scrollWidth + border;
        return card.scrollWidth > card.clientWidth;
      },
      write: (vertical) => this.vertical.set(vertical()),
    });
  }

  private watchAvailableWidth(): void {
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) =>
      this.availableWidth.set(entry.contentRect.width),
    );
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  private static readonly ALWAYS_INVOLVED = new Set(['obs', 'router', 'forwarder']);

  readonly transitionsByComponent = computed<
    Map<string, { inbound: FlowTransition[]; outbound: FlowTransition[] }>
  >(() => {
    const call = this.selectedCall();
    const map = new Map<string, { inbound: FlowTransition[]; outbound: FlowTransition[] }>();
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
    const map = new Map<string, Set<string>>();
    for (const backend of this.backends()) {
      const involved = new Set<string>();
      for (const comp of flow) {
        if (
          FlowPipeline.ALWAYS_INVOLVED.has(comp.name) ||
          this.hasBackendInTree(comp.data, backend.name)
        ) {
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
    return this.isComponentDimmed(flow[index].name) || this.isComponentDimmed(flow[index + 1].name);
  }

  shouldShowNA(compName: string): boolean {
    if (!this.selectedCall()) return false;
    const eb = this.effectiveBackend();
    if (!eb) return false;
    return !(this.involvedMap().get(eb)?.has(compName) ?? false);
  }

  shouldShowNone(compName: string, direction: 'inbound' | 'outbound'): boolean {
    const eb = this.effectiveBackend();
    if (!eb) return false;
    const involved = this.involvedMap().get(eb)?.has(compName) ?? false;
    if (!involved) return false;
    return !!(this.selectedCall() && this.getTransitions(compName, direction).length === 0);
  }

  getTransitions(compName: string, direction: 'inbound' | 'outbound'): FlowTransition[] {
    const entry = this.transitionsByComponent().get(compName);
    return entry ? entry[direction] : [];
  }

  callDuration(call: DebugSessionCall): string {
    if (!call.stoppedAt) return '—';
    const ms = this.parseIsoMs(call.stoppedAt) - this.parseIsoMs(call.startedAt);
    return `${ms.toFixed(3)}ms`;
  }

  private parseIsoMs(iso: string): number {
    const match = /\.(\d+)Z?$/.exec(iso);
    const base = new Date(iso).getTime();
    if (!match) return base;
    // getTime() truncates to milliseconds; recover full sub-ms precision from the fraction
    const frac = match[1];
    if (frac.length <= 3) return base;
    const subMs = parseFloat(`0.${frac.slice(3)}`);
    return base + subMs;
  }

  formatTransitionTooltip(t: FlowTransition): string {
    const lines = [
      `Started:  ${this.formatTimestamp(t.startedAt)}`,
      `Stopped:  ${this.formatTimestamp(t.stoppedAt)}`,
    ];
    if (t.result.outcome === 'failure' && t.result.cause) {
      lines.push(`Error:    ${t.result.cause}`);
    }
    return lines.join('\n');
  }

  private formatTimestamp(iso: string): string {
    const match = /T(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/.exec(iso);
    const timePart = match ? match[1] : iso;
    return `${new Date(iso).toLocaleDateString()} ${timePart}`;
  }

  private hasBackendInTree(data: unknown, name: string): boolean {
    if (data === null || data === undefined || typeof data !== 'object') return false;
    if (Array.isArray(data)) {
      return data.some((item) => this.hasBackendInTree(item, name));
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
      return `${indent}${key}:\n${value.map((item) => this.renderArrayItem(item, childIndent)).join('\n')}`;
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
            return `${prefix}${k}:\n${v.map((sub) => this.renderArrayItem(sub, subIndent)).join('\n')}`;
          }
          return `${prefix}${k}:\n${this.renderObject(v as Record<string, unknown>, `${indent}    `)}`;
        }
        return `${prefix}${k}: ${v ?? 'null'}`;
      })
      .join('\n');
  }
}
