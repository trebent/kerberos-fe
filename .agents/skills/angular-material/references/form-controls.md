# Form controls

Condensed from https://material.angular.dev/components/categories/form (form-field, input,
select, datepicker, timepicker, checkbox, radio, slider, slide-toggle, chips) and the
custom form field control guide.

## Standalone imports

```ts
import {MatFormField, MatLabel, MatError, MatHint, MatPrefix, MatSuffix}
  from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';          // text/textarea
import {MatSelect} from '@angular/material/select';        // <mat-select>
import {MatCheckbox} from '@angular/material/checkbox';
import {MatRadioGroup, MatRadioButton} from '@angular/material/radio';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSlider} from '@angular/material/slider';
```

Import only what the template uses. Never import `MatFormFieldModule` etc.

## Form field

Every `<mat-form-field>` MUST contain exactly one form control child (`matInput`, native
`select`/`MatSelect`, `mat-datepicker` input, `mat-chip-grid`, or a custom
`MatFormFieldControl`). A missing child throws at runtime — a classic build-time miss.

```html
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput formControlName="email" required>
  <mat-error>Email is required</mat-error>
  <mat-hint>example@domain.com</mat-hint>
</mat-form-field>
```

- `mat-error` only renders when the control is invalid AND touched/submitted — state this in
  tests instead of expecting immediate render.
- Appearance: M3 default is `fill`-equivalent; per-field `appearance="outline"` if needed.
- `MatPrefix`/`MatSuffix` add icon/text inside the field (e.g. a datepicker toggle).

## Forms integration

`mat-form-field` works with template-driven forms, Reactive Forms (`FormControl`,
`formControlName`), and Signal Forms (`@angular/forms/signals`, preferred for NEW forms per
AGENTS.md).

Reactive (existing repo pattern, `login.ts`):

```ts
readonly loginForm = this.fb.nonNullable.group({
  username: ['', Validators.required],
  password: ['', Validators.required],
});
```

```html
<mat-form-field>
  <mat-label>Username</mat-label>
  <input matInput [formControl]="username">
  <mat-error>Required</mat-error>
</mat-form-field>
```

Error rendering pattern — per-validator messages, using `@if` control flow (AGENTS.md
bans `*ngIf`):

```html
@if (username.hasError('required')) { <mat-error>Username is required</mat-error> }
@else if (username.hasError('minlength')) { <mat-error>Too short</mat-error> }
```

Cross-field error timing: implement `ErrorStateMatcher` (from `@angular/material/core`) and
provide it on the control (`[errorStateMatcher]`) when validity depends on form-level state.
The repo's `profile` page already does this.

## Select

```html
<mat-form-field>
  <mat-label>State</mat-label>
  <mat-select formControlName="state" required>
    @for (s of states; track s) {
      <option [value]="s.code">{{ s.name }}</option>
    }
  </mat-select>
</mat-form-field>
```

- `<mat-select>` is a form control; wrap in `<mat-form-field>`, use `<mat-label>` not
  placeholder.
- `MatSelectTrigger` for custom selected-value rendering; `multiple` for multi-select
  (value is an array).

## Datepicker / timepicker

```html
<mat-form-field>
  <mat-label>Start date</mat-label>
  <input matInput [matDatepicker]="picker">
  <mat-datepicker-toggle matIconSuffix [for]="picker" />
  <mat-datepicker #picker />
</mat-form-field>
```

Imports: `MatDatepicker, MatDatepickerInput, MatDatepickerToggle` from
`@angular/material/datepicker`. The `mat-datepicker` (panel) is a popup and is exempt from
density. Timepicker (`@angular/material/timepicker`) follows the same pattern.

## Checkbox / radio / slide toggle / slider

```html
<mat-checkbox formControlName="agree">I agree</mat-checkbox>

<mat-radio-group formControlName="color">
  @for (c of colors; track c) { <mat-radio-button [value]="c">{{c}}</mat-radio-button> }
</mat-radio-group>

<mat-slide-toggle formControlName="enabled">Feature</mat-slide-toggle>

<mat-slider min="0" max="100" step="5">
  <input matSliderThumb formControlName="volume">
</mat-slider>
```

Slider requires the thumb input element inside; `MatSlider, MatSliderThumb` imports.

## Chips

`MatChipSet` (display) / `MatChipGrid` (input into a form field) from
`@angular/material/chips`. For a chips form control inside `mat-form-field`, use
`MatChipGrid` with `MatFormFieldControl` compliance (see the official
creating-a-custom-form-field-control guide before building custom field controls — the
interface has many required members: `stateChanges`, `value`, `ngControl`, `focused`,
`empty`, `shouldLabelFloat`, `required`, `disabled`, `errorState`, `controlType`,
`setDescribedByIds`, `onContainerClick`).

## A11y checklist

- Always `<mat-label>` (floating label beats placeholder-only fields).
- Group radios in `mat-radio-group` with a visible group label.
- Validate with `Validators.required`/`pattern` and mirror messages in `mat-error` —
  screen readers announce the error text when it appears.
