import { DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DebugService } from '../../../api/admin/api/debug.service';
import { DebugSession } from '../../../api/admin/model/debug-session';
import { DebugSessionCall } from '../../../api/admin/model/debug-session-call';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ErrorDisplayComponent,
  ],
})
export class DebugComponent {
  private readonly debugService = inject(DebugService);
  private readonly destroyRef = inject(DestroyRef);

  readonly backends = input.required<string[]>();
  readonly closed = output<void>();
  readonly callSelected = output<DebugSessionCall | null>();

  readonly selectedBackend = signal<string | null>(null);
  readonly sessions = signal<DebugSession[]>([]);
  readonly selectedSessionId = signal<number | null>(null);
  readonly isLoadingSession = signal(false);
  readonly isStarting = signal(false);
  readonly isStopping = signal(false);
  readonly isDeleting = signal(false);
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
    return this.sessions().find(s => s.id === id) ?? null;
  });

  readonly isSessionRunning = computed(() => {
    const session = this.selectedSession();
    return !!session && !session.stoppedAt;
  });

  constructor() {
    effect(() => {
      const backend = this.selectedBackend();
      this.sessions.set([]);
      this.selectedSessionId.set(null);
      this._resetCallState();

      if (!backend) return;

      this.isLoadingSession.set(true);
      this.debugService.listDebugSessions(backend)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: sessions => {
            this.sessions.set([...sessions].sort((a, b) => a.id - b.id));
            this.isLoadingSession.set(false);
          },
          error: () => this.isLoadingSession.set(false),
        });
    });
  }

  onSessionSelect(id: number | null): void {
    this.selectedSessionId.set(id);
    this._resetCallState();
  }

  startSession(): void {
    const backend = this.selectedBackend();
    if (!backend || this.isStarting()) return;

    this.isStarting.set(true);
    this.debugService.startDebugSession(backend)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.sessions.update(list => [...list, session].sort((a, b) => a.id - b.id));
          this.selectedSessionId.set(session.id);
          this._resetCallState();
          this.isStarting.set(false);
        },
        error: () => this.isStarting.set(false),
      });
  }

  stopSession(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isStopping()) return;

    this.isStopping.set(true);
    this.debugService.stopDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const stopped = { ...session, stoppedAt: new Date().toISOString() };
          this.sessions.update(list => list.map(s => s.id === stopped.id ? stopped : s));
          this.isStopping.set(false);
        },
        error: () => this.isStopping.set(false),
      });
  }

  deleteSession(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isDeleting()) return;

    this.isDeleting.set(true);
    this.debugService.deleteDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sessions.update(list => list.filter(s => s.id !== session.id));
          this.selectedSessionId.set(null);
          this._resetCallState();
          this.isDeleting.set(false);
        },
        error: () => this.isDeleting.set(false),
      });
  }

  fetchCalls(): void {
    const session = this.selectedSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isFetchingCalls()) return;

    this.isFetchingCalls.set(true);
    this.callsFetchError.set(false);
    this.debugService.listDebugSessionCalls(backend, session.id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: calls => {
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

    this.callDetailSub = this.debugService.getDebugSessionCall(backend, session.id, call.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: fullCall => {
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

  statusClass(code: number): string {
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
