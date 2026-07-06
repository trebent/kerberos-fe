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

  readonly selectedBackend = signal<string | null>(null);
  readonly activeSession = signal<DebugSession | null>(null);
  readonly isLoadingSession = signal(false);
  readonly isStarting = signal(false);
  readonly isStopping = signal(false);
  readonly calls = signal<DebugSessionCall[]>([]);
  readonly callsFetched = signal(false);
  readonly isFetchingCalls = signal(false);
  readonly callsFetchError = signal(false);

  readonly isSessionRunning = computed(() => {
    const session = this.activeSession();
    return !!session && !session.stoppedAt;
  });

  constructor() {
    effect(() => {
      const backend = this.selectedBackend();
      this.activeSession.set(null);
      this.calls.set([]);
      this.callsFetched.set(false);
      this.callsFetchError.set(false);

      if (!backend) return;

      this.isLoadingSession.set(true);
      this.debugService.listDebugSessions(backend)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: sessions => {
            const now = new Date();
            const active = sessions.find(s => !s.stoppedAt && new Date(s.expiresAt) > now) ?? null;
            this.activeSession.set(active);
            this.isLoadingSession.set(false);
          },
          error: () => this.isLoadingSession.set(false),
        });
    });
  }

  startSession(): void {
    const backend = this.selectedBackend();
    if (!backend || this.isStarting()) return;

    this.isStarting.set(true);
    this.debugService.startDebugSession(backend)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.activeSession.set(session);
          this.calls.set([]);
          this.callsFetched.set(false);
          this.isStarting.set(false);
        },
        error: () => this.isStarting.set(false),
      });
  }

  stopSession(): void {
    const session = this.activeSession();
    const backend = this.selectedBackend();
    if (!session || !backend || this.isStopping()) return;

    this.isStopping.set(true);
    this.debugService.stopDebugSession(backend, session.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.activeSession.set({ ...session, stoppedAt: new Date().toISOString() });
          this.isStopping.set(false);
        },
        error: () => this.isStopping.set(false),
      });
  }

  fetchCalls(): void {
    const session = this.activeSession();
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
}
