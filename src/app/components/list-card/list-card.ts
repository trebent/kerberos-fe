import { Component, input, Resource } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../error-display/error-display';

/**
 * The card a management page shows for one kind of record: a create section above a list
 * section that reports how `resource` (the records) is loading. Mark the create form and anything
 * that belongs with it as `create`; everything else (the table and its messages) goes in the list,
 * which scrolls on its own when the card has a fixed height.
 *
 * ```html
 * <app-list-card heading="Users" createHeading="Create user" listHeading="All users"
 *                [resource]="usersResource" loadError="Failed to load users.">
 *   <div create>…create form…</div>
 *   <app-filtered-table …>…</app-filtered-table>
 * </app-list-card>
 * ```
 */
@Component({
  host: { class: 'section-card' },
  imports: [ErrorDisplay, MatDivider, MatProgressSpinner],
  selector: 'app-list-card',
  styleUrl: './list-card.scss',
  templateUrl: './list-card.html',
})
export class ListCard {
  readonly heading = input.required<string>();
  readonly createHeading = input.required<string>();
  readonly listHeading = input.required<string>();
  readonly resource = input.required<Resource<unknown>>();
  readonly loadError = input.required<string>();
  /** Shown instead of both sections while the card has nothing to work on yet. */
  readonly prompt = input<string | null>(null);
}
