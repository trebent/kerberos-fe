import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlowService } from '../../api/admin/api/flow.service';
import { FlowMetaDataOAS } from '../../api/admin/model/flow-meta-data-oas';
import { FlowPipelineComponent } from './flow-pipeline/flow-pipeline.component';
import { OasComponent } from './oas/oas.component';

@Component({
  selector: 'app-flow',
  template: `
    <button mat-icon-button class="menu-toggle" (click)="toggleDrawer()" aria-label="Toggle menu">
      <mat-icon>menu</mat-icon>
    </button>

    <div class="side-drawer" [class.open]="drawerOpen()">
      <div
        class="drawer-item"
        [class.disabled]="oasBackends().length === 0"
        (click)="toggleOasSection()"
      >
        <span>OAS</span>
        @if (oasBackends().length > 0) {
          <mat-icon class="drawer-chevron" [class.expanded]="oasExpanded()">chevron_right</mat-icon>
        }
      </div>
      @if (oasExpanded()) {
        @for (backend of oasBackends(); track backend) {
          <div
            class="drawer-subitem"
            [class.active]="selectedBackend() === backend"
            (click)="selectBackend(backend)"
          >
            {{ backend }}
          </div>
        }
      }

      <div class="drawer-item" (click)="onDebugClick()">
        <span>Debug</span>
      </div>
    </div>

    <div class="content-area">
      <div class="pipeline-area">
        <app-flow-pipeline
          [flowMetas]="flowResource.value() ?? null"
          [isLoading]="flowResource.isLoading()"
          [hasError]="!!flowResource.error()"
        />
      </div>

      @if (selectedBackend(); as backend) {
        <div class="oas-panel">
          <app-oas [backend]="backend" (closed)="closeOverlay()" />
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    .menu-toggle {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 30;
    }
    .side-drawer {
      width: 0;
      flex-shrink: 0;
      overflow: hidden;
      background: var(--mat-sys-surface-container-low);
      border-right: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      flex-direction: column;
      padding-top: 56px;
      transition: width 200ms ease;
    }
    .side-drawer.open {
      width: 220px;
    }
    .drawer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
      user-select: none;
      border-radius: 4px;
      margin: 2px 8px;
      white-space: nowrap;
    }
    .drawer-item:hover:not(.disabled) {
      background: var(--mat-sys-surface-container-high);
    }
    .drawer-item.disabled {
      opacity: 0.4;
      pointer-events: none;
    }
    .drawer-chevron {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: transform 150ms ease;
      color: var(--mat-sys-on-surface-variant);
    }
    .drawer-chevron.expanded {
      transform: rotate(90deg);
    }
    .drawer-subitem {
      display: flex;
      align-items: center;
      padding: 8px 16px 8px 28px;
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
      user-select: none;
      border-radius: 4px;
      margin: 1px 8px;
      white-space: nowrap;
    }
    .drawer-subitem:hover {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
    }
    .drawer-subitem.active {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .content-area {
      flex: 1;
      display: flex;
      min-width: 0;
      overflow: hidden;
    }
    .pipeline-area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      overflow: hidden;
    }
    .oas-panel {
      width: 45%;
      min-width: 280px;
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--mat-sys-outline-variant);
      overflow: hidden;
    }
  `],
  imports: [
    MatButtonModule,
    MatIconModule,
    FlowPipelineComponent,
    OasComponent,
  ],
})
export class FlowComponent {
  private readonly flowService = inject(FlowService);

  readonly flowResource = rxResource({
    stream: () => this.flowService.getFlow(),
  });

  readonly oasBackends = computed<string[]>(() => {
    const flow = this.flowResource.value();
    if (!flow) return [];
    const oasComp = flow.find(c => c.name === 'oas-validator');
    if (!oasComp) return [];
    return (oasComp.data as unknown as FlowMetaDataOAS).backends ?? [];
  });

  readonly drawerOpen = signal(false);
  readonly oasExpanded = signal(false);
  readonly selectedBackend = signal<string | null>(null);

  toggleDrawer(): void {
    this.drawerOpen.update(open => !open);
  }

  toggleOasSection(): void {
    if (this.oasBackends().length === 0) return;
    this.oasExpanded.update(expanded => !expanded);
  }

  selectBackend(backend: string): void {
    this.selectedBackend.set(backend);
    this.drawerOpen.set(true);
  }

  closeOverlay(): void {
    this.selectedBackend.set(null);
    this.drawerOpen.set(false);
  }

  onDebugClick(): void {
    this.selectedBackend.set(null);
  }
}


