---
name: angular-material
description: Use when building UI in this repo with Angular Material (`@angular/material`) components, Material 3 theming, `mat-*` elements, `--mat-sys-*` CSS variables, CDK primitives, or Material component harnesses in tests. Covers the standalone import convention, M3 theming via `mat.theme()`, forms integration (Reactive + Signal Forms), overlays, navigation/layout, data tables, CDK, and testing. This repo uses Angular Material by default.
license: MIT
metadata:
  author: this repo
  version: '1.0'
  short-description: Angular Material v22 (M3) usage guidelines for this repo
---

# Angular Material (v22, Material 3)

This repo uses `@angular/material@22` with the Material 3 (M3) theming system. The theme is
already configured in `src/styles.scss`; never add another theme, prebuilt theme CSS, or
`@angular/animations`. Follow the rules below, then read the reference that matches the task.

## Hard rules

1. **Import standalone classes, never NgModules.** All `Mat*` components/directives are
   standalone since v15. Import only what the template uses — e.g. `MatButton` from
   `@angular/material/button`, not `MatButtonModule`. Some legacy `MatXxxModule` imports still
   exist in this repo; do not add new ones, and migrate them opportunistically when editing a
   file that already imports one.
2. **Version pinning.** `@angular/material` peers an *exact* `@angular/cdk` version
   (22.2.2 ↔ 22.2.2). Never bump one without the other; use `ng update @angular/material`,
   which handles both plus migrations.
3. **No animations module.** Material 22 animates via native CSS. Do not add
   `provideAnimationsAsync()` or `@angular/animations` anywhere.
4. **Theme through tokens, not hardcoded colors.** Style custom components with
   `--mat-sys-*` variables (or the `mat-*` utility classes from `mat.system-classes()`).
   Adjust component appearance with the `overrides` mixins, never by overriding Material's
   internal CSS classes or DOM structure — those are private implementation details.
5. **New Material code must compile and pass a11y.** After generating Material code, run
   `ng build`. Common failures: missing form-field child control (a `mat-form-field` requires
   an input/select/etc.), a table sort header with no `MatSort` wiring, and standalone
   component templates referencing elements whose classes aren't imported.

## Repo conventions

- Theme: `src/styles.scss` defines
  `mat.theme((color: (primary: mat.$magenta-palette, tertiary: mat.$violet-palette), typography: Roboto, density: 0))` on `html`, plus
  `mat.system-classes()`, and `color-scheme: light dark` on `body`. Both light and dark
  modes are live — always use system variables instead of literal colors so dark mode works.
- State: signals (`signal`, `computed`) with `inject()` for services (see `AGENTS.md`).
- Forms: prefer Signal Forms (`@angular/forms/signals`) for new forms; `mat-form-field`
  supports both. Reactive Forms patterns exist in `login`/`register`.
- Feedback: `inject(MatSnackBar).open(message, 'Close', {duration: 3000})` for transient
  messages (pattern used in `login`/`register`).

## References

Read the file that matches the task, under `references/` next to this file:

- **Theming, tokens, utility classes, overrides, dark mode**: [theming.md](references/theming.md)
- **Form field, input, select, datepicker/timepicker, checkbox/radio/slider/toggle/chips, forms integration, error handling**: [form-controls.md](references/form-controls.md)
- **Dialog, snack bar, tooltip, menu, bottom sheet**: [overlays.md](references/overlays.md)
- **Toolbar, sidenav, tabs, stepper, list, card, buttons, icons, progress, badge, expansion, grid**: [navigation-layout.md](references/navigation-layout.md)
- **Table with sort and pagination**: [data-table.md](references/data-table.md)
- **CDK primitives (a11y, overlay, drag-drop, virtual scroll, layout breakpoints, clipboard)**: [cdk.md](references/cdk.md)
- **Component test harnesses**: [testing.md](references/testing.md)

## Scaffolding shortcuts

`ng generate @angular/material:navigation|dashboard|table|address-form|tree <name>` and
`ng generate @angular/cdk:drag-drop <name>` generate working Material components — then apply
the rules above (they generate NgModule-era code; convert imports to standalone classes).

Official docs: https://material.angular.dev/ (guides + per-component API and styling tabs).
