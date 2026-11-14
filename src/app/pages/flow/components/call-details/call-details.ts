import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { DebugSessionCall } from '../../../../services/admin';
import { httpStatusClass } from '../../../../utils/http-status';

/** The request line, status and timing of one call recorded by a debug session. */
@Component({
  imports: [DatePipe],
  selector: 'app-call-details',
  styleUrl: './call-details.scss',
  templateUrl: './call-details.html',
})
export class CallDetails {
  readonly call = input.required<DebugSessionCall>();

  protected readonly statusClass = computed(() => httpStatusClass(this.call().statusCode));

  /** How long the call took, to the microsecond when Kerberos reports it that precisely. */
  protected readonly duration = computed(() => {
    const { startedAt, stoppedAt } = this.call();
    if (!stoppedAt) return '—';
    return `${(preciseTimeMs(stoppedAt) - preciseTimeMs(startedAt)).toFixed(3)}ms`;
  });
}

/**
 * Milliseconds since the epoch for an ISO timestamp, keeping the sub-millisecond digits
 * that `Date` drops (`…T10:00:00.123456Z` → `….123456`).
 */
function preciseTimeMs(iso: string): number {
  const ms = new Date(iso).getTime();
  const fraction = /\.(\d+)Z?$/.exec(iso)?.[1];
  if (!fraction || fraction.length <= 3) return ms;
  return ms + parseFloat(`0.${fraction.slice(3)}`);
}
