import { Component, input } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';

import { IdSelection } from '../../utils/id-selection';

/** A labelled group of checkboxes, one per item, that ticks item IDs in `selection`. */
@Component({
  imports: [MatCheckbox],
  selector: 'app-checkbox-group',
  styles: ':host { display: block; }',
  templateUrl: './checkbox-group.html',
})
export class CheckboxGroup {
  readonly legend = input.required<string>();
  readonly items = input.required<readonly { id: number; name: string }[]>();
  readonly selection = input.required<IdSelection>();
}
