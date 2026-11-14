import { computed, DestroyRef, inject, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

/** How long a success message stays on screen. */
const SUCCESS_MESSAGE_MS = 3000;

export interface RequestStatusMessages {
  /** Shown when the request fails, until the next request starts. */
  failure: string;
  /** Shown for a few seconds after the request succeeds. Leave it out to show nothing. */
  success?: string;
}

/** Runs one kind of request (creating a user, saving a group…) and tracks how it went. */
export interface RequestStatus {
  /** The failure message of the last request, or null. */
  readonly error: Signal<string | null>;
  /** The success message while it is on screen, or null. */
  readonly success: Signal<string | null>;
  /** True while a request is in flight, to disable the button that sends it. */
  readonly pending: Signal<boolean>;
  /** Subscribes to `request$`, clearing the previous outcome, and calls `onSuccess` with its value. */
  run<T>(request$: Observable<T>, onSuccess?: (value: T) => void): void;
}

/**
 * Creates a {@link RequestStatus}. Show it with `<app-request-feedback [status]="…" />`.
 * Requests and timers stop when the component is destroyed, so call this in an injection
 * context, such as a field initializer.
 */
export function requestStatus(messages: RequestStatusMessages): RequestStatus {
  const destroyRef = inject(DestroyRef);
  const error = signal<string | null>(null);
  const success = signal<string | null>(null);
  const inFlight = signal(0);
  let hideSuccess: ReturnType<typeof setTimeout> | undefined;
  destroyRef.onDestroy(() => clearTimeout(hideSuccess));

  return {
    error: error.asReadonly(),
    success: success.asReadonly(),
    pending: computed(() => inFlight() > 0),
    run(request$, onSuccess) {
      error.set(null);
      success.set(null);
      clearTimeout(hideSuccess);
      inFlight.update((count) => count + 1);

      request$.pipe(takeUntilDestroyed(destroyRef)).subscribe({
        next: (value) => {
          onSuccess?.(value);
          if (messages.success) {
            success.set(messages.success);
            hideSuccess = setTimeout(() => success.set(null), SUCCESS_MESSAGE_MS);
          }
        },
        error: () => {
          error.set(messages.failure);
          inFlight.update((count) => count - 1);
        },
        complete: () => inFlight.update((count) => count - 1),
      });
    },
  };
}
