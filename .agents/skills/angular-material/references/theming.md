# Theming (Material 3)

Condensed from the official theming guides:
https://material.angular.dev/guide/theming and
https://material.angular.dev/guide/theming-your-components

## What's already set up in this repo

`src/styles.scss` contains the single source of theme truth:

```scss
@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme((color: (primary: magenta, tertiary: violet palettes),
      typography: Roboto, density: 0));
  @include mat.system-classes();
}

body {
  color-scheme: light dark;
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-body-medium);
}
```

`mat.theme()` emits CSS variables (design tokens) consumed by every Material component and
available to app CSS. Colors are emitted with the CSS `light-dark()` function, so light/dark
switching is driven by `color-scheme` — already `light dark` here (system preference).

Rules:

- Only categories included in the map emit variables (this repo includes color, typography,
  density).
- To change app colors later, edit the palettes in `mat.theme()` — do not create a second
  global theme or import a prebuilt theme CSS file.
- Multiple themes are legal for scoped regions: call `@include mat.theme((color: ...))`
  again inside a selector; only `color` is usually re-specified there.

## System tokens for custom components

Style custom components with `--mat-sys-*` variables so they follow the theme and both
color modes automatically:

```scss
.my-banner {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
  border: 1px solid var(--mat-sys-outline-variant);
  font: var(--mat-sys-body-large);
}
```

Commonly used tokens:

- Primary/secondary/tertiary pairs: `--mat-sys-primary`, `--mat-sys-on-primary`,
  `--mat-sys-primary-container`, `--mat-sys-on-primary-container` (same pattern for
  `secondary` and `tertiary`), plus `*-fixed` / `*-fixed-dim` variants.
- Error: `--mat-sys-error`, `--mat-sys-on-error`, `--mat-sys-error-container`,
  `--mat-sys-on-error-container`.
- Surface: `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-on-surface-variant`,
  `--mat-sys-surface-container` (plus `-lowest`, `-low`, `-high`, `-highest`),
  `--mat-sys-surface-dim`, `--mat-sys-surface-bright`, `--mat-sys-surface-tint`.
- Misc: `--mat-sys-background`, `--mat-sys-on-background`, `--mat-sys-outline`,
  `--mat-sys-outline-variant`, `--mat-sys-scrim`, `--mat-sys-shadow`,
  `--mat-sys-inverse-surface`, `--mat-sys-inverse-on-surface`, `--mat-sys-inverse-primary`.
- Typography: `--mat-sys-body-medium`, `--mat-sys-body-large`, `--mat-sys-title-medium`, etc.
  (usable via the `font:` shorthand).
- Shape/elevation tokens also exist for corners and levels — see the official
  theming-your-components guide for the full list.

## Utility classes

`mat.system-classes()` (already included) generates `mat-*` utility classes equivalent to
the tokens, usable directly in templates:

```html
<div class="mat-bg-primary-container mat-text-on-primary-container mat-font-body-lg"></div>
```

Pattern: `mat-bg-<token>` (backgrounds), `mat-text-<token>` (text colors), `mat-font-<style>`
(typography), `mat-border-<token>` (borders).

## Overriding tokens (the supported way to customize)

- System tokens, scoped to a selector:

```scss
@include mat.theme-overrides((primary-container: #84ffff));
```

or as a second argument: `@include mat.theme((...), $overrides: (primary-container: orange));`

- Per-component tokens (validated against the component's token list; see each component's
  "Styling" tab in the docs):

```scss
@include mat.card-overrides((
  elevated-container-color: red,
  elevated-container-shape: 32px,
  title-text-size: 2rem,
));
```

Never target Material's internal DOM/classes in CSS — Angular explicitly does not support it
and it breaks across versions.

## Palettes and density

- Prebuilt palettes: `mat.$red-palette`, `$green`, `$blue`, `$yellow`, `$cyan`, `$magenta`,
  `$orange`, `$chartreuse`, `$spring-green`, `$azure`, `$violet`, `$rose` (all under the
  `mat.` namespace).
- Custom palettes: `ng generate @angular/material:theme-color` generates M3 palettes from
  your brand colors.
- Density: `0` (default) to `-5` (compact), each step -4px. Density below 0 reduces
  accessibility affordances; never go below -2 here. Pop-up components (e.g. datepicker) are
  not affected by density.

## Accessibility: strong focus indicators

Default focus styling (background change) may not meet WCAG contrast requirements. To enable
highly visible outlines, add to `html`:

```scss
@include mat.strong-focus-indicators();
// or with config:
@include mat.strong-focus-indicators((
  border-color: red, border-style: dotted, border-width: 4px, border-radius: 2px,
));
```

This repo's AGENTS.md requires WCAG AA — prefer including it if the app's default focus
visibility is judged insufficient.
