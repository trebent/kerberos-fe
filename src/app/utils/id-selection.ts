import { linkedSignal, Signal, WritableSignal } from '@angular/core';

/** The IDs ticked in a list of checkboxes, such as a group's permissions or a user's groups. */
export class IdSelection {
  private readonly ids: WritableSignal<readonly number[]>;

  /** The ticked IDs, in the order they were ticked. */
  readonly selected: Signal<readonly number[]>;

  /**
   * Starts with the IDs `initial` returns. When `initial` reads signals, such as a resource
   * that is still loading, the selection starts over from it each time they change.
   */
  constructor(initial: () => readonly number[] = () => []) {
    this.ids = linkedSignal(initial);
    this.selected = this.ids.asReadonly();
  }

  has(id: number): boolean {
    return this.ids().includes(id);
  }

  toggle(id: number): void {
    this.ids.update((ids) =>
      ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
    );
  }

  set(ids: readonly number[]): void {
    this.ids.set(ids);
  }
}
