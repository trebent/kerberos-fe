import { computed, effect, inject, PendingTasks, signal, Signal, untracked } from '@angular/core';

/** How long a skeleton stays on screen once shown, so a fast load does not flash it. */
export const SKELETON_MIN_DURATION_MS = 600;

/**
 * Whether to show a loading skeleton: while `loading()` is true, and once shown, for at least
 * `SKELETON_MIN_DURATION_MS`. A skeleton that appears and vanishes within a frame or two reads
 * as the page flickering, so a fast load keeps it a little longer.
 *
 * Swap the skeleton for the content with `@if (showSkeleton()) { … } @else { … }`, so the loaded
 * content does not appear beside a skeleton that is still held.
 *
 * Call it in an injection context, such as a field initializer. Until the skeleton goes, the app
 * counts as unstable, so a spec that awaits `fixture.whenStable()` sees the loaded content.
 */
export function skeletonVisible(loading: () => boolean): Signal<boolean> {
  const pendingTasks = inject(PendingTasks);
  const held = signal(false);
  let shownAt = 0;

  effect((onCleanup) => {
    if (loading()) {
      if (!untracked(held)) {
        shownAt = Date.now();
        held.set(true);
      }
      return;
    }
    if (!untracked(held)) return;

    const removeTask = pendingTasks.add();
    const timer = setTimeout(
      () => {
        held.set(false);
        removeTask();
      },
      Math.max(0, shownAt + SKELETON_MIN_DURATION_MS - Date.now()),
    );
    // Loading started again, or the component was destroyed: drop the pending hide.
    onCleanup(() => {
      clearTimeout(timer);
      removeTask();
    });
  });

  return computed(() => loading() || held());
}
