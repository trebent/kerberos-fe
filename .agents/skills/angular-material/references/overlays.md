# Overlays: dialog, snack bar, tooltip, menu, bottom sheet

Condensed from the official component docs. All overlay components are pop-up contexts:
they are not affected by theme density and sit in a CDK overlay container (global position
strategies; viewport/scroll handling included).

## Dialog (`@angular/material/dialog`)

```ts
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialog} from './confirm-dialog';

const ref = this.dialog.open(ConfirmDialog, {data: {title: 'Delete item?'}});
ref.afterClosed().subscribe(result => { /* result from ref.close(result) */ });
```

- The dialog component imports the section directives: `MatDialogTitle`,
  `MatDialogContent`, `MatDialogActions`, and `MatDialogClose` (closes with an optional
  value), plus `MAT_DIALOG_DATA` for injected data:

```ts
@Component({imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose], ...})
export class ConfirmDialog {
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
```

- Config: `{width, height, position, hasBackdrop, panelClass, autoFocus, restoreFocus}`.
- `autoFocus` defaults to the first focusable element; `restoreFocus` returns focus to the
  trigger — keep both defaults for a11y unless there's a reason.
- Escape/backdrop close by default; disable with `disableClose: true` only for destructive
  confirmations if required.

## Snack bar (`@angular/material/snack-bar`)

Repo pattern (see `login.ts` / `register.ts`) — simple text messages:

```ts
readonly snackBar = inject(MatSnackBar);

this.snackBar.open('Logged in successfully.', 'Close', {
  duration: 3000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
});
```

- `open()` returns an `MatSnackBarRef` with `afterDismissed()` / `dismiss()`.
- For richer content use `openFromComponent(...)`. Config fields: duration, position
  (`start|center|end` / `top|bottom`), panelClass, data.
- Keep duration set (3000ms here) — a snackbar without duration never auto-dismisses and
  blocks the a11y live region for later messages.

## Tooltip (`@angular/material/tooltip`)

```html
<button mat-icon-button matTooltip="Delete" [matTooltipPosition]="'above'">
```

- Attribute directive `matTooltip` on any element; positions `above|below|left|right`
  (default below); `[matTooltipDisabled]` to suppress.
- Default show delay is long-ish; tune globally via `MAT_TOOLTIP_DEFAULT_OPTIONS` if needed.
- Tooltips are NOT accessible replacements for visible labels — they augment icon-only
  buttons; the icon button should still have an `aria-label`.

## Menu (`@angular/material/menu`)

```html
<button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Open menu">
  <mat-icon>more_vert</mat-icon>
</mat-icon>
<mat-menu #menu="matMenu">
  <button mat-menu-item (click)="edit()">Edit</button>
  <button mat-menu-item disabled>Archive</button>
</mat-menu>
```

Imports: `MatMenu, MatMenuTrigger, MatMenuItem`. For context menus, `MatContextMenuTrigger`.
Menu items should be `<button mat-menu-item>` (real buttons for keyboard/screen-reader
support). Keyboard nav (arrows, escape) is built in.

## Bottom sheet (`@angular/material/bottom-sheet`)

Mobile-style bottom panel, same open/close pattern as dialog:

```ts
const ref = this.bottomSheet.open(OptionsSheet, {data: ...});
ref.afterDismissed().subscribe(...)
```

Prefer bottom sheet over dialog on small-viewport, list-like choices (Material spec).

## Common pitfalls

- Overlay content renders in a global container, NOT inside the component template —
  component-scoped CSS selectors won't reach it. Use `panelClass` + global styles, or
  `--mat-sys-*` tokens inside the dialog/sheet component's own styles.
- All overlay services are injectable singletons (`inject(MatDialog)`), `providedIn:
  'root'` — no module setup, no providers to add.
