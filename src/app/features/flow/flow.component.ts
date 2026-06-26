import { Component } from '@angular/core';
import { DebugComponent } from './debug/debug.component';
import { OasComponent } from './oas/oas.component';

@Component({
  selector: 'app-flow',
  template: `
    <h2>Flow</h2>
    <p>Flow — not yet implemented.</p>

    <h3>Debug</h3>
    <app-debug />

    <h3>OAS</h3>
    <app-oas />
  `,
  imports: [DebugComponent, OasComponent],
})
export class FlowComponent {}
