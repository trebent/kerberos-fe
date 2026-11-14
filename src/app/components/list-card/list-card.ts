import {
  Component,
  computed,
  effect,
  input,
  output,
  Resource,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Observable, switchMap } from 'rxjs';

import { ErrorDisplay } from '../error-display/error-display';
import { Skeleton } from '../skeleton/skeleton';

/** The part of a `MatTableDataSource` this card drives, whatever its row type. */
interface ListDataSource {
  filter: string;
  paginator: MatPaginator | null | undefined;
  /** The rows the table shows: filtered and paged. */
  connect(): Observable<readonly unknown[]>;
}

/**
 * The card a management page shows for one kind of record: a header with the title, a filter
 * and an add button, then the projected `mat-table` with a paginator. Bind the table and this
 * card to the same data source; the filter narrows its rows and the paginator pages them.
 *
 * The card reports how `resource` (the records) is loading: skeleton rows on the first load or
 * after a parameter change, a progress bar while it reloads, and a message when the list is
 * empty. Project an `<app-request-feedback>` to show a row action's error above the table.
 *
 * ```html
 * <app-list-card heading="Users" addLabel="Add user" filterExample="alice"
 *                [resource]="usersResource" [dataSource]="dataSource" (add)="addUser()">
 *   <app-request-feedback [status]="deleteStatus" />
 *   <table mat-table [dataSource]="dataSource">…</table>
 * </app-list-card>
 * ```
 */
@Component({
  host: { class: 'section-card' },
  imports: [
    ErrorDisplay,
    MatButton,
    MatFormField,
    MatIcon,
    MatInput,
    MatPaginator,
    MatPrefix,
    MatProgressBar,
    Skeleton,
  ],
  selector: 'app-list-card',
  styleUrl: './list-card.scss',
  templateUrl: './list-card.html',
})
export class ListCard {
  /** The plural name of the records, such as "Users"; the messages use it in lower case. */
  readonly heading = input.required<string>();
  readonly addLabel = input.required<string>();
  readonly resource = input.required<Resource<unknown>>();
  readonly dataSource = input.required<ListDataSource>();
  /** A value the user might filter by, shown in the filter's placeholder. */
  readonly filterExample = input.required<string>();

  readonly add = output<void>();

  protected readonly noun = computed(() => this.heading().toLowerCase());
  protected readonly filterText = signal('');
  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  /** The rows the table shows now: filtered and paged. */
  private readonly shownRows = toSignal(
    toObservable(this.dataSource).pipe(switchMap((dataSource) => dataSource.connect())),
    { initialValue: [] },
  );
  protected readonly isEmpty = computed(() => this.shownRows().length === 0);

  private readonly paginator = viewChild.required(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource().paginator = this.paginator();
    });
  }

  protected filter(event: Event): void {
    const text = (event.target as HTMLInputElement).value.trim();
    this.filterText.set(text);
    this.dataSource().filter = text.toLowerCase();
  }
}
