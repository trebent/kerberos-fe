import { toggleId } from './selection';

describe('toggleId', () => {
  it('adds a missing ID', () => {
    expect(toggleId([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('removes a present ID', () => {
    expect(toggleId([1, 2, 3], 2)).toEqual([1, 3]);
  });
});
