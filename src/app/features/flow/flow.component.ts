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
  templateUrl: './flow.component.html',
  styleUrl: './flow.component.scss',
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


