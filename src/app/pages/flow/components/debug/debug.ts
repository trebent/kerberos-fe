import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { Subscription } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { DebugService, DebugSession, DebugSessionCall } from '../../../../services/admin';
import { httpStatusClass } from '../../../../utils/http-status';

@Component({
  host: { class: 'section-card' },
  imports: [
    DatePipe,
    ErrorDisplay,
    FormsModule,
    MatButton,
    MatDivider,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatLabel,
    MatOption,
    MatProgressSpinner,
    MatSelect,
  ],
  selector: 'app-debug',
  styleUrl: './debug.scss',
  templateUrl: './debug.html',
})
export class Debug {
  private readonly debugService = inject(DebugService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly httpStatusClass = httpStatusClass;

  readonly backends = input.required<string[]>();
  readonly closed = output<void>();
  readonly callSelected = output<DebugSessionCall | null>();
  readonly backendChange = output<string | null>();

  readonly selectedBackend = signal<string | null>(null);
  readonly sessions = signal<DebugSession[]>([]);
  readonly selectedSessionId = signal<number | null>(null);
  readonly isLoadingSession = signal(false);
  readonly isStarting = signal(false);
  readonly isStopping = signal(false);
  readonly isDeleting = signal(false);
  readonly sessionErrors = signal<string[]>([]);
  readonly calls = signal<DebugSessionCall[]>([]);
  readonly callsFetched = signal(false);
  readonly isFetchingCalls = signal(false);
  readonly callsFetchError = signal(false);
  readonly selectedCallId = signal<number | null>(null);
  readonly isFetchingCallDetail = signal(false);
  readonly callDetailError = signal(false);

  private callDetailSub: Subscription | null = null;

  readonly selectedSession = computed<DebugSession | null>(() => {
    const id = this.selectedSessionId();
    if (id === null) return null;
    return this.sessions().find((s) => s.id === id) ?? null;
  });

  readonly isSessionRunning = computed(() => {
    const session = this.selectedSession();
    return !!session && !session.stoppedAt && new Date(session.expiresAt) > new Date();
  });

  constructor() {
    effect((onCleanup) => {
      const backend = this.selectedBackend();
      this.backendChange.emit(backend);
      this.sessions.set([]);
      this.selectedSessionId.set(null);
      this.sessionErrors.set([]);
      this.resetCallState();

      if (!backend) {
        this.isLoadingSession.set(false);
        return;
      }

      this.isLoadingSession.set(true);
      const subscription = this.debugService.listDebugSessions(backend).subscribe({
        next: (sessions) => {
          this.sessions.set([...sessions].sort((a, b) => a.id - b.id));
          this.isLoadingSession.set(false);
        },
        error: () => {
          this.sessionErrors.set(['Failed to load debug sessions.']);
          this.isLoadingSession.set(false);
        },
      });
      // Drop the response if another backend is picked (or the panel closes) before it arrives.
      onCleanup(() => subscription.unsubscribe());
    });
  }

  onSessionSelect(id: number | null): void {
    this.selectedSessionId.set(id);
    this.sessionErrors.set([]);
    this.resetCallState();
  }

  startSession(): void {
    const backend = this.selectedBackend();
    if (!backend || this.isStarting()) return;

    this.isStarting.set(true);
    this.sessionErrors.set([]);
    this.debugService
      .startDebugSession(backend)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.sessions.update((list) => [...list, session].sort((a, b) => a.id - b.id));
          this.selectedSessionId.set(session.id);
          this.resetCallState();
          this.isStarting.set(false);
        },
        error: () => {
          this.sessionErrors.set(['Failed to start a debug session.']);
          this.isStarting.set(false);
        },
      });
  }

  stopSession(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isStopping()) return;

    this.isStopping.set(true);
    this.sessionErrors.set([]);
    this.debugService
      .stopDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const stopped = { ...session, stoppedAt: new Date().toISOString() };
          this.sessions.update((list) => list.map((s) => (s.id === stopped.id ? stopped : s)));
          this.isStopping.set(false);
        },
        error: () => {
          this.sessionErrors.set(['Failed to stop the debug session.']);
          this.isStopping.set(false);
        },
      });
  }

  deleteSession(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.sessionErrors.set([]);
    this.debugService
      .deleteDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sessions.update((list) => list.filter((s) => s.id !== session.id));
          this.selectedSessionId.set(null);
          this.resetCallState();
          this.isDeleting.set(false);
        },
        error: () => {
          this.sessionErrors.set(['Failed to delete the debug session.']);
          this.isDeleting.set(false);
        },
      });
  }

  fetchCalls(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isFetchingCalls()) return;

    this.isFetchingCalls.set(true);
    this.callsFetchError.set(false);
    this.debugService
      .listDebugSessionCalls(backend, session.id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (calls) => {
          const sorted = [...calls].sort(
            (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
          );
          this.calls.set(sorted);
          this.callsFetched.set(true);
          this.isFetchingCalls.set(false);
        },
        error: () => {
          this.callsFetchError.set(true);
          this.isFetchingCalls.set(false);
        },
      });
  }

  onCallClick(call: DebugSessionCall): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isFetchingCallDetail()) return;

    if (this.selectedCallId() === call.id) {
      this.selectedCallId.set(null);
      this.callSelected.emit(null);
      return;
    }

    this.selectedCallId.set(call.id);
    this.isFetchingCallDetail.set(true);
    this.callDetailError.set(false);
    this.callDetailSub?.unsubscribe();

    this.callDetailSub = this.debugService
      .getDebugSessionCall(backend, session.id, call.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fullCall) => {
          this.isFetchingCallDetail.set(false);
          this.callSelected.emit(fullCall);
        },
        error: () => {
          this.isFetchingCallDetail.set(false);
          this.callDetailError.set(true);
          this.selectedCallId.set(null);
          this.callSelected.emit(null);
        },
      });
  }

  private resetCallState(): void {
    this.calls.set([]);
    this.callsFetched.set(false);
    this.callsFetchError.set(false);
    this.selectedCallId.set(null);
    this.isFetchingCallDetail.set(false);
    this.callDetailError.set(false);
    this.callDetailSub?.unsubscribe();
    this.callDetailSub = null;
    this.callSelected.emit(null);
  }
}
