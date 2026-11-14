import { signal } from '@angular/core';

import { IdSelection } from './id-selection';

describe('IdSelection', () => {
  it('ticks and unticks IDs', () => {
    const selection = new IdSelection();
    selection.set([1, 2]);

    selection.toggle(3);
    selection.toggle(1);

    expect(selection.selected()).toEqual([2, 3]);
    expect(selection.has(1)).toBe(false);
    expect(selection.has(3)).toBe(true);
  });

  it('starts over from its initial IDs when they change', () => {
    const loaded = signal<readonly number[]>([]);
    const selection = new IdSelection(() => loaded());
    selection.toggle(5);

    loaded.set([1, 2]);

    expect(selection.selected()).toEqual([1, 2]);
  });
});
