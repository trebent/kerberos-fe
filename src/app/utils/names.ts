/** The items' names as a comma-separated list for a table cell, or a dash when there are none. */
export function joinNames(items: readonly { name: string }[] | undefined): string {
  return items?.length ? items.map((item) => item.name).join(', ') : '—';
}
