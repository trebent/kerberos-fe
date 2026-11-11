/** Returns a copy of `ids` with `id` removed if it was present, or added if it was not. */
export function toggleId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}
