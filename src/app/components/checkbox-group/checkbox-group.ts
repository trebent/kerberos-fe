import { Component, input } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';

import { IdSelection } from '../../utils/id-selection';
import { skeletonVisible } from '../../utils/skeleton-visible';
import { Skeleton } from '../skeleton/skeleton';

/**
 * A labelled group of checkboxes, one per item, that ticks item IDs in `selection`. While
 * `loading`, it shows placeholder lines in place of the checkboxes.
 */
@Component({
  imports: [MatCheckbox, Skeleton],
  selector: 'app-checkbox-group',
  styles: `
    :host {
      display: block;
    }

    // Lines up with a checkbox: its 40px touch target, the box centred in it.
    .skeleton-line {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      height: 40px;
      padding-inline-start: 11px;
    }

    .empty {
      margin: 0.5rem 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  templateUrl: './checkbox-group.html',
})
export class CheckboxGroup {
  readonly legend = input.required<string>();
  readonly items = input.required<readonly { id: number; name: string }[]>();
  readonly selection = input.required<IdSelection>();
  readonly loading = input(false);

  protected readonly skeletonLines = ['6rem', '8rem', '5rem'];
  protected readonly showSkeleton = skeletonVisible(this.loading);
}
