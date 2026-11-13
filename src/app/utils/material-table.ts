import { effect, Resource } from '@angular/core';
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
 * A `mat-table` data source showing a resource's rows. While the resource has no value (it is
 * loading after a parameter change, or it failed) the table is empty, so it never shows rows
 * from an earlier request. Call it in an injection context, such as a field initializer.
 */
export function resourceDataSource<T>(resource: Resource<T[] | undefined>): MatTableDataSource<T> {
  const dataSource = new MatTableDataSource<T>();
  effect(() => {
    dataSource.data = resource.hasValue() ? (resource.value() ?? []) : [];
  });
  return dataSource;
}
