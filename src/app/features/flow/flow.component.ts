import { Component } from '@angular/core';
import { FlowPipelineComponent } from './flow-pipeline/flow-pipeline.component';

@Component({
  selector: 'app-flow',
  template: `<app-flow-pipeline />`,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
    }
  `],
  imports: [FlowPipelineComponent],
})
export class FlowComponent {}
