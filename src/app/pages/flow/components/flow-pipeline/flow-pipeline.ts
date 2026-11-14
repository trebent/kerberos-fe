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
  FlowMetaDataRouterBackend,
  FlowTransition,
} from '../../../../services/admin';
import { componentsOnPath, describeFlowData, flowComponentData } from '../../../../utils/flow-meta';
import { CallDetails } from '../call-details/call-details';
import { Placeholder, TransitionBadges } from '../transition-badges/transition-badges';

type Direction = 'inbound' | 'outbound';

@Component({
  imports: [CallDetails, MatIcon, MatTooltip, TransitionBadges],
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

  protected readonly backends = computed<FlowMetaDataRouterBackend[]>(() => {
    return flowComponentData(this.flowMetas(), 'router')?.backends ?? [];
  });

  protected readonly hoveredBackend = signal<string | null>(null);

  /** Runs the pipeline top to bottom because it does not fit across the available width. */
  protected readonly vertical = signal(false);
  /** The width of the host, kept up to date while the page is resized or panels open. */
  private readonly availableWidth = signal(0);
  /** The width the pipeline needed the last time it was laid out horizontally. */
  private horizontalWidth = 0;

  /** The backend whose path is shown: the debugged call's, else the hovered one. */
  private readonly effectiveBackend = computed<string | null>(
    () => this.callBackend() ?? this.hoveredBackend(),
  );

  /** The components each backend's requests pass through, by backend name. */
  private readonly componentsOnPath = computed(
    () =>
      new Map(
        this.backends().map((backend) => [
          backend.name,
          componentsOnPath(this.flowMetas(), backend.name),
        ]),
      ),
  );

  /** The selected call's transitions, by component and direction. */
  private readonly transitionsByComponent = computed(() => {
    const byComponent = new Map<string, Record<Direction, FlowTransition[]>>();
    for (const transition of this.selectedCall()?.flowTransitions ?? []) {
      let entry = byComponent.get(transition.component);
      if (!entry) {
        entry = { inbound: [], outbound: [] };
        byComponent.set(transition.component, entry);
      }
      const inbound = transition.direction === FlowTransition.DirectionEnum.Inbound;
      entry[inbound ? 'inbound' : 'outbound'].push(transition);
    }
    return byComponent;
  });

  protected readonly describeFlowData = describeFlowData;

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

  private isOnPath(backend: string, component: string): boolean {
    return this.componentsOnPath().get(backend)?.has(component) ?? false;
  }

  protected isComponentDimmed(component: string): boolean {
    const hovered = this.hoveredBackend();
    return hovered !== null && !this.isOnPath(hovered, component);
  }

  protected isArrowDimmed(index: number): boolean {
    const flow = this.flowMetas();
    return this.isComponentDimmed(flow[index].name) || this.isComponentDimmed(flow[index + 1].name);
  }

  /**
   * What to show in a component's badge row when it recorded no transitions for the selected call:
   * "n/a" when the call's backend does not pass through it, "none" when it does.
   */
  protected placeholder(component: string, direction: Direction): Placeholder | null {
    const backend = this.effectiveBackend();
    if (!this.selectedCall() || !backend) return null;
    if (!this.isOnPath(backend, component)) return 'n/a';
    return this.transitions(component, direction).length === 0 ? 'none' : null;
  }

  protected transitions(component: string, direction: Direction): FlowTransition[] {
    return this.transitionsByComponent().get(component)?.[direction] ?? [];
  }

  protected describeBackend(backend: FlowMetaDataRouterBackend): string {
    return `host: ${backend.host}\nport: ${backend.port}`;
  }
}
