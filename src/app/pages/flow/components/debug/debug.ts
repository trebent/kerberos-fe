import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { outputFromObservable, rxResource, toObservable } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { map } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { Skeleton } from '../../../../components/skeleton/skeleton';
import { DebugService, DebugSession, DebugSessionCall } from '../../../../services/admin';
import { httpStatusClass } from '../../../../utils/http-status';
import { requestStatus } from '../../../../utils/request-status';

/** Which session's recorded calls to list. A new object fetches them again. */
interface CallsRequest {
  backend: string;
  sessionId: number;
}

/**
 * Starts, stops and deletes a backend's debug sessions, and lists the calls a session recorded.
 * Selecting a call loads its flow transitions and emits it, so the pipeline can show them.
 */
@Component({
  host: { class: 'section-card' },
  imports: [
    DatePipe,
    ErrorDisplay,
    MatButton,
    MatDivider,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatLabel,
    MatOption,
    MatProgressSpinner,
    MatSelect,
    RequestFeedback,
    Skeleton,
  ],
  selector: 'app-debug',
  styleUrl: './debug.scss',
  templateUrl: './debug.html',
})
export class Debug {
  private readonly debugService = inject(DebugService);

  readonly backends = input.required<string[]>();
  readonly closed = output<void>();

  protected readonly httpStatusClass = httpStatusClass;

  protected readonly selectedBackend = signal<string | null>(null);

  /** The selected backend's sessions, oldest first. Changing backend cancels a load in flight. */
  protected readonly sessionsResource = rxResource({
    params: () => this.selectedBackend() ?? undefined,
    stream: ({ params: backend }) =>
      this.debugService.listDebugSessions(backend).pipe(map(oldestFirst)),
  });

  protected readonly selectedSessionId = linkedSignal<string | null, number | null>({
    source: this.selectedBackend,
    computation: () => null,
  });

  protected readonly selectedSession = computed(() => {
    const id = this.selectedSessionId();
    if (id === null || !this.sessionsResource.hasValue()) return null;
    return this.sessionsResource.value().find((session) => session.id === id) ?? null;
  });

  protected readonly isSessionRunning = computed(() => {
    const session = this.selectedSession();
    return !!session && !session.stoppedAt && new Date(session.expiresAt) > new Date();
  });

  /** Set by "Fetch calls", and cleared when another session is selected. */
  private readonly callsRequest = linkedSignal<number | null, CallsRequest | undefined>({
    source: this.selectedSessionId,
    computation: () => undefined,
  });

  /** The fetched calls, newest first. */
  protected readonly callsResource = rxResource({
    params: () => this.callsRequest(),
    stream: ({ params: { backend, sessionId } }) =>
      this.debugService.listDebugSessionCalls(backend, sessionId, false).pipe(map(newestFirst)),
  });

  protected readonly selectedCallId = linkedSignal<number | null, number | null>({
    source: this.selectedSessionId,
    computation: () => null,
  });

  /** The selected call with its flow transitions, which the call list does not include. */
  private readonly callDetailResource = rxResource({
    params: () => {
      const backend = this.selectedBackend();
      const sessionId = this.selectedSessionId();
      const callId = this.selectedCallId();
      if (backend === null || sessionId === null || callId === null) return undefined;
      return { backend, sessionId, callId };
    },
    stream: ({ params: { backend, sessionId, callId } }) =>
      this.debugService.getDebugSessionCall(backend, sessionId, callId),
  });
  protected readonly callDetailLoading = this.callDetailResource.isLoading;
  protected readonly callDetailFailed = computed(() => !!this.callDetailResource.error());

  /** The backend being debugged, so the pipeline can highlight its path. */
  readonly backendChange = outputFromObservable(toObservable(this.selectedBackend));
  /** The selected call once its transitions have loaded, or null. */
  readonly callSelected = outputFromObservable(
    toObservable(
      computed(() =>
        this.callDetailResource.hasValue() ? (this.callDetailResource.value() ?? null) : null,
      ),
    ),
  );

  protected readonly startStatus = requestStatus({ failure: 'Failed to start a debug session.' });
  protected readonly stopStatus = requestStatus({ failure: 'Failed to stop the debug session.' });
  protected readonly deleteStatus = requestStatus({
    failure: 'Failed to delete the debug session.',
  });

  protected startSession(): void {
    const backend = this.selectedBackend();
    if (backend === null) return;
    this.startStatus.run(this.debugService.startDebugSession(backend), (session) => {
      if (this.selectedBackend() !== backend) return;
      this.sessionsResource.update((sessions) => oldestFirst([...(sessions ?? []), session]));
      this.selectedSessionId.set(session.id);
    });
  }

  protected stopSession(): void {
    const backend = this.selectedBackend();
    const session = this.selectedSession();
    if (backend === null || session === null) return;
    this.stopStatus.run(this.debugService.stopDebugSession(backend, session.id), () => {
      if (this.selectedBackend() !== backend) return;
      const stoppedAt = new Date().toISOString();
      this.sessionsResource.update((sessions) =>
        sessions?.map((other) => (other.id === session.id ? { ...other, stoppedAt } : other)),
      );
    });
  }

  protected deleteSession(): void {
    const backend = this.selectedBackend();
    const session = this.selectedSession();
    if (backend === null || session === null) return;
    this.deleteStatus.run(this.debugService.deleteDebugSession(backend, session.id), () => {
      if (this.selectedBackend() !== backend) return;
      this.sessionsResource.update((sessions) =>
        sessions?.filter((other) => other.id !== session.id),
      );
      this.selectedSessionId.set(null);
    });
  }

  protected fetchCalls(): void {
    const backend = this.selectedBackend();
    const sessionId = this.selectedSessionId();
    if (backend === null || sessionId === null) return;
    this.callsRequest.set({ backend, sessionId });
  }

  /** Selects a call, or clears the selection when it is already selected. */
  protected toggleCall(call: DebugSessionCall): void {
    this.selectedCallId.update((id) => (id === call.id ? null : call.id));
  }
}

function oldestFirst(sessions: DebugSession[]): DebugSession[] {
  return [...sessions].sort((a, b) => a.id - b.id);
}

function newestFirst(calls: DebugSessionCall[]): DebugSessionCall[] {
  return [...calls].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}
