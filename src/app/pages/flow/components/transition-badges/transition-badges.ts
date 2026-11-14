import { Component, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

import { FlowTransition } from '../../../../services/admin';

/** Shown in place of transitions: see FlowPipeline.placeholder. */
export type Placeholder = 'n/a' | 'none';

/** One row of OK/NOK badges for the transitions a flow component recorded in one direction. */
@Component({
  host: { class: 'transitions-row' },
  imports: [MatTooltip],
  selector: 'app-transition-badges',
  styleUrl: './transition-badges.scss',
  templateUrl: './transition-badges.html',
})
export class TransitionBadges {
  readonly transitions = input.required<readonly FlowTransition[]>();
  readonly placeholder = input<Placeholder | null>(null);

  protected tooltip(transition: FlowTransition): string {
    const lines = [
      `Started:  ${formatTimestamp(transition.startedAt)}`,
      `Stopped:  ${formatTimestamp(transition.stoppedAt)}`,
    ];
    if (transition.result.outcome === 'failure' && transition.result.cause) {
      lines.push(`Error:    ${transition.result.cause}`);
    }
    return lines.join('\n');
  }
}

/** The local date and the full-precision UTC time of an ISO timestamp. */
function formatTimestamp(iso: string): string {
  const time = /T(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/.exec(iso)?.[1] ?? iso;
  return `${new Date(iso).toLocaleDateString()} ${time}`;
}
