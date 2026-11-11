import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../../components/error-display/error-display';
import {
  DebugSessionCall,
  FlowMetaDataOAS,
  FlowMetaDataRouter,
  FlowService,
} from '../../services/admin';
import { Debug } from './components/debug/debug';
import { FlowPipeline } from './components/flow-pipeline/flow-pipeline';
import { Oas } from './components/oas/oas';

@Component({
  imports: [
    Debug,
    ErrorDisplay,
    FlowPipeline,
    MatButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatProgressSpinner,
    Oas,
  ],
  selector: 'app-flow',
  styleUrl: './flow.scss',
  templateUrl: './flow.html',
})
export class Flow {
  private readonly flowService = inject(FlowService);

  protected readonly flowResource = rxResource({
    stream: () => this.flowService.getFlow(),
  });

  /** Backends the OAS validator has a specification for. */
  readonly oasBackends = computed<string[]>(() => {
    const oas = this.flowComponent<FlowMetaDataOAS>('oas-validator');
    return oas?.backends ?? [];
  });

  /** Backends the router forwards to. */
  readonly routerBackends = computed<string[]>(() => {
    const router = this.flowComponent<FlowMetaDataRouter>('router');
    return router?.backends?.map((backend) => backend.name) ?? [];
  });

  readonly selectedOASBackend = signal<string | null>(null);
  readonly debugOpen = signal(false);
  readonly selectedDebugCall = signal<DebugSessionCall | null>(null);
  readonly selectedDebugBackend = signal<string | null>(null);

  selectOASBackend(backend: string): void {
    if (this.selectedOASBackend() === backend) {
      this.selectedOASBackend.set(null);
      return;
    }

    this.selectedOASBackend.set(backend);
    this.closeDebug();
  }

  closeOAS(): void {
    this.selectedOASBackend.set(null);
  }

  onDebugClick(): void {
    if (this.debugOpen()) {
      this.closeDebug();
      return;
    }

    this.selectedOASBackend.set(null);
    this.debugOpen.set(true);
  }

  closeDebug(): void {
    this.debugOpen.set(false);
    this.selectedDebugCall.set(null);
    this.selectedDebugBackend.set(null);
  }

  onDebugCallSelected(call: DebugSessionCall | null): void {
    this.selectedDebugCall.set(call);
  }

  /** The data of the named flow component, if the flow has loaded and contains it. */
  private flowComponent<T>(name: string): T | undefined {
    if (!this.flowResource.hasValue()) return undefined;
    return this.flowResource.value().find((component) => component.name === name)?.data as
      T | undefined;
  }
}
