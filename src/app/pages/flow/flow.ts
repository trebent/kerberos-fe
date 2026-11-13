import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

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

  protected readonly oasBackends = computed<string[]>(() => {
    if (!this.flowResource.hasValue()) return [];
    const flow = this.flowResource.value();
    if (!flow) return [];
    const oasComp = flow.find((c) => c.name === 'oas-validator');
    if (!oasComp) return [];
    return (oasComp.data as unknown as FlowMetaDataOAS).backends ?? [];
  });

  protected readonly routerBackends = computed<string[]>(() => {
    if (!this.flowResource.hasValue()) return [];
    const flow = this.flowResource.value();
    if (!flow) return [];
    const routerComp = flow.find((c) => c.name === 'router');
    if (!routerComp) return [];
    return (routerComp.data as unknown as FlowMetaDataRouter).backends?.map((b) => b.name) ?? [];
  });

  protected readonly selectedOASBackend = signal<string | null>(null);
  protected readonly debugOpen = signal(false);
  protected readonly selectedDebugCall = signal<DebugSessionCall | null>(null);
  protected readonly selectedDebugBackend = signal<string | null>(null);

  protected selectOASBackend(backend: string): void {
    if (this.selectedOASBackend() === backend) {
      this.selectedOASBackend.set(null);
      return;
    }

    this.selectedOASBackend.set(backend);
    this.closeDebug();
  }

  protected closeOAS(): void {
    this.selectedOASBackend.set(null);
  }

  protected onDebugClick(): void {
    if (this.debugOpen()) {
      this.closeDebug();
      return;
    }

    this.selectedOASBackend.set(null);
    this.debugOpen.set(true);
  }

  protected closeDebug(): void {
    this.debugOpen.set(false);
    this.selectedDebugCall.set(null);
    this.selectedDebugBackend.set(null);
  }

  protected onDebugCallSelected(call: DebugSessionCall | null): void {
    this.selectedDebugCall.set(call);
  }
}
