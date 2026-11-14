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

@Component({
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

  readonly backends = input.required<string[]>();
  readonly closed = output<void>();
  readonly callSelected = output<DebugSessionCall | null>();
  readonly backendChange = output<string | null>();

  protected readonly selectedBackend = signal<string | null>(null);
  protected readonly sessions = signal<DebugSession[]>([]);
  protected readonly selectedSessionId = signal<number | null>(null);
  protected readonly isLoadingSession = signal(false);
  protected readonly isStarting = signal(false);
  protected readonly isStopping = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly calls = signal<DebugSessionCall[]>([]);
  protected readonly callsFetched = signal(false);
  protected readonly isFetchingCalls = signal(false);
  protected readonly callsFetchError = signal(false);
  protected readonly selectedCallId = signal<number | null>(null);
  protected readonly isFetchingCallDetail = signal(false);
  protected readonly callDetailError = signal(false);

  private callDetailSub: Subscription | null = null;

  protected readonly selectedSession = computed<DebugSession | null>(() => {
    const id = this.selectedSessionId();
    if (id === null) return null;
    return this.sessions().find((s) => s.id === id) ?? null;
  });

  protected readonly isSessionRunning = computed(() => {
    const session = this.selectedSession();
    return !!session && !session.stoppedAt && new Date(session.expiresAt) > new Date();
  });

  constructor() {
    effect(() => {
      const backend = this.selectedBackend();
      this.backendChange.emit(backend);
      this.sessions.set([]);
      this.selectedSessionId.set(null);
      this._resetCallState();

      if (!backend) return;

      this.isLoadingSession.set(true);
      this.debugService
        .listDebugSessions(backend)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (sessions) => {
            this.sessions.set([...sessions].sort((a, b) => a.id - b.id));
            this.isLoadingSession.set(false);
          },
          error: () => this.isLoadingSession.set(false),
        });
    });
  }

  protected onSessionSelect(id: number | null): void {
    this.selectedSessionId.set(id);
    this._resetCallState();
  }

  protected startSession(): void {
    const backend = this.selectedBackend();
    if (!backend || this.isStarting()) return;

    this.isStarting.set(true);
    this.debugService
      .startDebugSession(backend)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.sessions.update((list) => [...list, session].sort((a, b) => a.id - b.id));
          this.selectedSessionId.set(session.id);
          this._resetCallState();
          this.isStarting.set(false);
        },
        error: () => this.isStarting.set(false),
      });
  }

  protected stopSession(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isStopping()) return;

    this.isStopping.set(true);
    this.debugService
      .stopDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const stopped = { ...session, stoppedAt: new Date().toISOString() };
          this.sessions.update((list) => list.map((s) => (s.id === stopped.id ? stopped : s)));
          this.isStopping.set(false);
        },
        error: () => this.isStopping.set(false),
      });
  }

  protected deleteSession(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.debugService
      .deleteDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sessions.update((list) => list.filter((s) => s.id !== session.id));
          this.selectedSessionId.set(null);
          this._resetCallState();
          this.isDeleting.set(false);
        },
        error: () => this.isDeleting.set(false),
      });
  }

  protected fetchCalls(): void {
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

  protected onCallClick(call: DebugSessionCall): void {
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

  protected statusClass(code: number): string {
    return code >= 200 && code < 300 ? 'status-ok' : 'status-err';
  }

  private _resetCallState(): void {
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
