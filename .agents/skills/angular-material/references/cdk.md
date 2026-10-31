# CDK primitives (`@angular/cdk`)

Use CDK when you need the behavior without Material's styling, or when building custom
components on the same primitives Material uses. Material components already use CDK
internally — overlay, a11y, drag-drop, etc. are always available since Material pins the
same CDK version.

## a11y (`@angular/cdk/a11y`)

- `FocusTrap`/`CDK_TRAP_FOCUS` (`cdkTrapFocus`) — trap Tab focus inside dialogs/menus.
- `FocusKeyManager`/`ActiveDescendantKeyManager` — arrow-key list navigation (matches
  `ListKeyManager` usage in `mat-select`, `mat-menu`).
- `LiveAnnouncer` — `inject(LiveAnnouncer).announce('Saved')` for screen-reader-only
  messages (used by Material for sort announcements).
- `FocusMonitor` — detect how an element got focus (keyboard vs mouse) to show
  focus rings appropriately.
- `cdkAriaLive` attribute directive for live regions.

Note: Angular v22 also ships `@angular/aria` (stable) with headless accessible primitives
(accordion, listbox, combobox, menu, tree...). Prefer `@angular/aria` for NEW headless
components; use CDK a11y for the utilities above and where Material integrates.

## Overlay (`@angular/cdk/overlay`)

Only build custom overlays when dialog/tooltip/menu can't express it:

```ts
const ref = this.overlay.position()
  .flexiblePositionStrategyTo(...)  // build position via OverlayPositionBuilder
```

Standard usage: `overlay.create({positionStrategy, hasBackdrop})`, attach a
`ComponentPortal` or `TemplatePortal`. Position strategies: `flexible` (most cases),
`global` (centered), and connection to an origin element via
`overlay.position().connectedTo(origin, ...)`.

## Portal (`@angular/cdk/portal`)

`ComponentPortal` / `TemplatePortal` render dynamic content into `cdkPortalOutlet` — the
same mechanism dialogs and snack bars use.

## Drag and drop (`@angular/cdk/drag-drop`)

```html
<div cdkDropList [cdkDropListData]="items()" (cdkDropListDropped)="drop($event)">
  @for (item of items(); track item.id) {
    <div cdkDrag>{{ item.name }}</div>
  }
</div>
```

```ts
import {moveItemInArray, transferArrayItem, CdkDragDrop} from '@angular/cdk/drag-drop';

drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items(), event.previousIndex, event.currentIndex);
  this.items.set([...this.items()]);  // signals: new array reference
}
```

- `cdkDropList` boundary + `cdkDropListConnectedTo` for multi-list transfer
  (`transferArrayItem`).
- `cdkDragHandle` restricts grabbing to a handle; `cdkDragDisabled` toggles.
- Scaffold: `ng generate @angular/cdk:drag-drop <name>`.
- Keep drag lists keyboard accessible: pair with `cdkDropList` reorder announcements or
  an explicit move up/down control — AXE will flag pure-pointer reordering.

## Virtual scrolling (`@angular/cdk/scrolling`)

```html
<cdk-virtual-scroll-viewport itemSize="48">
  @for (item of items(); track item.id) {
    <div *cdkVirtualFor="let item of items()">{{ item.name }}</div>
  }
</cdk-virtual-scroll-viewport>
```

Use for long lists (hundreds+ rows). `*cdkVirtualFor` supports `trackBy`, and
`FixedSizeVirtualScrollStrategy` via `itemSize` handles sizing; `<cdk-virtual-for-viewport>`
requires a fixed height CSS (the viewport element gets a set height).

## Layout breakpoints (`@angular/cdk/layout`)

```ts
readonly breakpointObserver = inject(BreakpointObserver);

readonly isSmall = toSignal(
  this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
    .pipe(map(r => r.matches)), {initialValue: false});
```

Use for responsive sidenav mode switches (`mode="over"` on mobile, `"side"` on desktop).
`Breakpoints` covers WebXL-style sizes; match against standard tokens, not custom px.

## Other utilities

- `@angular/cdk/clipboard` — `Clipboard.copy(text)` or `cdkCopyToClipboard` directive
  (the "copy link" button next to inputs).
- `@angular/cdk/bidi` — RTL/LTR detection (`Dir` service); Material components handle
  RTL themselves; use for custom mirrored layouts.
- `@angular/cdk/collections` — `SelectionModel` (multi-select state), `ArrayDataSource`.
- `@angular/cdk/text-field` — `AutofillMonitor` for autofill event detection.
- `@angular/cdk/testing` — test harness infrastructure (see testing.md).
