import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatActionList,
  MatListItem,
  MatListItemMeta,
  MatListItemTitle,
} from '@angular/material/list';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';

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
    MatActionList,
    MatIcon,
    MatIconButton,
    MatListItem,
    MatListItemMeta,
    MatListItemTitle,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
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

  readonly oasBackends = computed<string[]>(() => {
    if (!this.flowResource.hasValue()) return [];
    const flow = this.flowResource.value();
    if (!flow) return [];
    const oasComp = flow.find((c) => c.name === 'oas-validator');
    if (!oasComp) return [];
    return (oasComp.data as unknown as FlowMetaDataOAS).backends ?? [];
  });

  readonly routerBackends = computed<string[]>(() => {
    if (!this.flowResource.hasValue()) return [];
    const flow = this.flowResource.value();
    if (!flow) return [];
    const routerComp = flow.find((c) => c.name === 'router');
    if (!routerComp) return [];
    return (routerComp.data as unknown as FlowMetaDataRouter).backends?.map((b) => b.name) ?? [];
  });

  readonly drawerOpen = signal(false);
  readonly oasExpanded = signal(false);
  readonly selectedOASBackend = signal<string | null>(null);
  readonly debugOpen = signal(false);
  readonly selectedDebugCall = signal<DebugSessionCall | null>(null);
  readonly selectedDebugBackend = signal<string | null>(null);

  toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  toggleOASSection(): void {
    if (this.oasBackends().length === 0) return;
    this.oasExpanded.update((expanded) => !expanded);
  }

  selectOASBackend(backend: string): void {
    if (this.selectedOASBackend() === backend) {
      this.selectedOASBackend.set(null);
      return;
    }

    this.selectedOASBackend.set(backend);
    this.debugOpen.set(false);
    this.drawerOpen.set(true);
  }

  closeOAS(): void {
    this.selectedOASBackend.set(null);
  }

  onDebugClick(): void {
    this.selectedOASBackend.set(null);
    this.debugOpen.update((open) => !open);
  }

  closeDebug(): void {
    this.debugOpen.set(false);
    this.selectedDebugCall.set(null);
    this.selectedDebugBackend.set(null);
  }

  onDebugCallSelected(call: DebugSessionCall | null): void {
    this.selectedDebugCall.set(call);
  }
}
