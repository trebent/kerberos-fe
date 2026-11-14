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
});
