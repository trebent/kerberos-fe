import { Component, computed, inject, signal } from '@angular/core';
import { catchError, from, switchMap, tap, throwError } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlowService } from '../../api/admin/api/flow.service';
import { OasService } from '../../api/admin/api/oas.service';
import { FlowMetaDataOAS } from '../../api/admin/model/flow-meta-data-oas';
import { ErrorDisplayComponent } from '../../shared/components/error-display/error-display.component';
import { FlowPipelineComponent } from './flow-pipeline/flow-pipeline.component';

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

    <div class="pipeline-area">
      <app-flow-pipeline
        [flowMetas]="flowResource.value() ?? null"
        [isLoading]="flowResource.isLoading()"
        [hasError]="!!flowResource.error()"
      />

      @if (selectedBackend()) {
        <div class="oas-overlay">
          <div class="oas-overlay-header">
            <span class="oas-overlay-title">{{ selectedBackend() }}</span>
            <button mat-icon-button (click)="closeOverlay()" aria-label="Close OAS viewer">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="oas-overlay-body">
            @if (oasResource.isLoading()) {
              <div class="oas-loading">
                <mat-spinner diameter="32" />
              </div>
            }
            @if (oasResource.error() && !oasResource.isLoading()) {
              <app-error-display [errors]="['Failed to load OAS spec.']" />
            }
            @if (oasResource.hasValue()) {
              <pre class="oas-pre">{{ oasResource.value() }}</pre>
            }
          </div>
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
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 220px;
      z-index: 20;
      background: var(--mat-sys-surface-container-low);
      border-right: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      flex-direction: column;
      padding-top: 56px;
      transform: translateX(-100%);
      transition: transform 200ms ease;
      overflow-y: auto;
    }
    .side-drawer.open {
      transform: translateX(0);
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
    }
    .drawer-subitem:hover {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
    }
    .drawer-subitem.active {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .pipeline-area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .oas-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: var(--mat-sys-surface);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .oas-overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 8px 8px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      flex-shrink: 0;
    }
    .oas-overlay-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
    }
    .oas-overlay-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
    .oas-loading {
      display: flex;
      justify-content: center;
      padding: 32px;
    }
    .oas-pre {
      margin: 0;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 0.8rem;
      line-height: 1.5;
      white-space: pre;
      color: var(--mat-sys-on-surface);
    }
  `],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FlowPipelineComponent,
    ErrorDisplayComponent,
  ],
})
export class FlowComponent {
  private readonly flowService = inject(FlowService);
  private readonly oasService = inject(OasService);

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

  readonly oasResource = rxResource({
    params: () => this.selectedBackend() ?? undefined,
    stream: ({ params: backend }) => {
      return this.oasService.getBackendOAS(backend, 'body', false, { httpHeaderAccept: 'application/yaml' }).pipe(
        tap(response => console.debug('[oasResource] raw response', response)),
        switchMap(response => from((response as unknown as Blob).text())),
        tap(text => console.debug('[oasResource] parsed text', text)),
        catchError(err => { console.debug('[oasResource] error', err); return throwError(() => err); }),
      );
    }
  });

  toggleDrawer(): void {
    this.drawerOpen.update(open => !open);
  }

  toggleOasSection(): void {
    if (this.oasBackends().length === 0) return;
    this.oasExpanded.update(expanded => !expanded);
  }

  selectBackend(backend: string): void {
    this.selectedBackend.set(backend);
  }

  closeOverlay(): void {
    this.selectedBackend.set(null);
  }

  onDebugClick(): void {
    this.selectedBackend.set(null);
  }
}

