import { Component, computed, input, numberAttribute } from '@angular/core';

export type SkeletonShape = 'text' | 'rect' | 'circle';

/**
 * A pulsing placeholder block shown while content loads.
 *
 * - `text` (default): one bar per line, sized to the surrounding font so swapping in the real
 *   text does not shift the layout. With `lines > 1` the last line is shorter, like a paragraph.
 * - `rect`: a block of an explicit `height`, for images, charts or cards.
 * - `circle`: a round block of `width` (height follows), for avatars.
 *
 * The block is hidden from assistive technology. Mark the loading region with `aria-busy` and
 * announce the loading state in text there.
 *
 * Restyle it with `--app-skeleton-color` and `--app-skeleton-radius`. Without them it uses the
 * Material 3 system tokens, falling back to a black tint outside a Material theme.
 */
@Component({
  selector: 'app-skeleton',
  host: {
    'aria-hidden': 'true',
    '[class]': '"app-skeleton-" + shape()',
    '[style.width]': 'width()',
    '[style.--app-skeleton-height]': 'height()',
  },
  styleUrl: './skeleton.scss',
  templateUrl: './skeleton.html',
})
export class Skeleton {
  readonly shape = input<SkeletonShape>('text');
  /** Any CSS length. Defaults to the full width of the container. */
  readonly width = input('100%');
  /** Any CSS length. Used by `rect`; `text` follows the font size and `circle` its width. */
  readonly height = input('4rem');
  /** Number of text lines. Only used by the `text` shape. */
  readonly lines = input(1, { transform: numberAttribute });

  protected readonly bars = computed(() =>
    Array.from({ length: this.shape() === 'text' ? Math.max(1, this.lines()) : 1 }, (_, i) => i),
  );
}
