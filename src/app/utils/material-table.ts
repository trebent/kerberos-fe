import { effect, Resource, Signal } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';

/** Everything a basic `mat-table` template needs, as standalone imports. */
export const MAT_TABLE = [
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
] as const;

/**
 * A `mat-table` data source showing a resource's rows, paged by the table's paginator.
 *
 * The rows follow the resource: they are emptied while it has no value (loading after a
 * parameter change, or failed), so the table never shows rows from an earlier request. The
 * paginator is attached once the table renders it. Call this in an injection context, such as
 * a field initializer.
 */
export function resourceDataSource<T>(
  resource: Resource<T[] | undefined>,
  paginator: Signal<MatPaginator | undefined>,
): MatTableDataSource<T> {
  const dataSource = new MatTableDataSource<T>();
  effect(() => {
    dataSource.paginator = paginator() ?? null;
  });
  effect(() => {
    dataSource.data = resource.hasValue() ? (resource.value() ?? []) : [];
  });
  return dataSource;
}
