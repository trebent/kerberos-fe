# Data table

Condensed from https://material.angular.dev/components/table/overview — the `mat-table`
is a headless, template-driven table: you define the columns and cells, it wires sorting,
pagination, and styling.

## Basic table

```ts
imports: [MatTable, MatColumnDef, MatHeaderCell, MatCell, MatHeaderRow, MatRow]
```

```html
<table mat-table [dataSource]="rows">
  <ng-container matColumnDef="name">
    <th mat-header-cell *matHeaderCellDef>Name</th>
    <td mat-cell *matCellDef="let row">{{ row.name }}</td>
  </ng-container>
  <ng-container matColumnDef="email">
    <th mat-header-cell *matHeaderCellDef>Email</th>
    <td mat-cell *matCellDef="let row">{{ row.email }}</td>
  </ng-container>

  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
</table>
```

- `displayedColumns = ['name', 'email']` must match the `matColumnDef` names.
- Structure columns with `@for` is NOT applicable here — `*matHeaderCellDef`/
  `*matCellDef` structural directives are the supported pattern (they are not `*ngIf`).
- `MatTextColumn` shortcut renders a plain text column:
  `<ng-container matColumnDef="name"><mat-text-column></mat-text-column></ng-container>`.
- `MatNoDataRow` renders a row shown when `dataSource` is empty.

## DataSource

- Static/simple data: pass an array (`[dataSource]="rows()"`) — plain arrays work.
- Sort + pagination + filter: `MatTableDataSource` wraps a plain array and implements
  all three:

```ts
readonly dataSource = new MatTableDataSource<Item>([]);
readonly displayedColumns = ['name', 'email'];

// wire up after view init
@ViewChild(MatSort) sort: MatSort;          // this.sort = viewChild(MatSort) w/ signals API
this.dataSource.sort = this.sort;
this.dataSource.paginator = this.paginator;
this.dataSource.filter = term;
```

- Custom server-driven data: implement the `DataSource` interface
  (`connect`/`disconnect` returning an Observable of row arrays) instead of
  `MatTableDataSource`.

## Sorting

```html
<ng-container matColumnDef="name">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
  ...
```

```html
<mat-sort (matSortChange)="onSort($event)">
  <table mat-table [dataSource]="dataSource" matSort ...>
```

With `MatTableDataSource`, the sort UI is inert unless `dataSource.sort` is wired — the #1
mistake: header renders but nothing happens. Use `matSortDisableClear` to disable the
third click clearing sort.

## Pagination

```html
<mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
```

`MatPaginator` + `dataSource.paginator = paginator` for client-side paging. Listen to
`page` for server-side paging.

## Selection

Add a checkbox column with `MatCheckbox` in a header/cell template; track selection in a
`SelectionModel<T>` from `@angular/cdk/collections`; toggling calls
`selection.toggle(row)`. The official docs have this recipe in the table overview.

## Row rendering tips

- Use `track`-stable identity in `dataSource` data (id field) — the table renders rows via
  `*matRowDef`; Angular row-diffing uses object identity.
- Sticky header: pass `sticky` to the header row def:
  `<tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true">`.
- Flex layouts: the table also works as `<mat-table>` (div-based) when you can't use
  `<table>` semantics — same column defs, `mat-cell` on divs.
- Footer rows: `MatFooterRow, MatFooterCell, MatFooterCellDef`.

## Scaffold

`ng generate @angular/material:table <name>` generates a sorted+paginated table with
`MatTableDataSource` — fastest correct starting point; convert its NgModule imports to
standalone classes after generating.
