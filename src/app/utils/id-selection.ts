import { signal } from '@angular/core';

/** The IDs ticked in a list of checkboxes, such as a group's permissions or a user's groups. */
export class IdSelection {
  private readonly ids = signal<readonly number[]>([]);

  /** The ticked IDs, in the order they were ticked. */
  readonly selected = this.ids.asReadonly();

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
