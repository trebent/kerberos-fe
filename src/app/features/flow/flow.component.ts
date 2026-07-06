import { Component } from '@angular/core';
import { DebugComponent } from './debug/debug.component';
import { FlowPipelineComponent } from './flow-pipeline/flow-pipeline.component';
import { OasComponent } from './oas/oas.component';

@Component({
  selector: 'app-flow',
  template: `
    <h2>Flow</h2>
    <app-flow-pipeline />

    <h3>Debug</h3>
    <app-debug />

    <h3>OAS</h3>
    <app-oas />
  `,
  imports: [FlowPipelineComponent, DebugComponent, OasComponent],
})
export class FlowComponent {}
