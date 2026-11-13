import { Component, effect, input, viewChild } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

/**
 * A filter field and paginator around a projected `mat-table`. Bind the table and this component
 * to the same data source; typing in the filter narrows its rows, and the paginator pages them.
 *
 * ```html
 * <app-filtered-table [dataSource]="dataSource" filterExample="admin">
 *   <table mat-table [dataSource]="dataSource">…</table>
 * </app-filtered-table>
 * ```
 */
/** The part of a `MatTableDataSource` this component drives, whatever its row type. */
type FilterableDataSource = Pick<MatTableDataSource<unknown>, 'filter' | 'paginator'>;

@Component({
  imports: [MatFormField, MatInput, MatLabel, MatPaginator],
  selector: 'app-filtered-table',
  styleUrl: './filtered-table.scss',
  templateUrl: './filtered-table.html',
})
export class FilteredTable {
  readonly dataSource = input.required<FilterableDataSource>();
  /** A value the user might filter by, shown as the field's placeholder. */
  readonly filterExample = input.required<string>();

  private readonly paginator = viewChild.required(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource().paginator = this.paginator();
    });
  }

  protected filter(event: Event): void {
    this.dataSource().filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }
}
