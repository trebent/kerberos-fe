# Design rules

The conventions every change to this app follows. Where a rule conflicts with a skill from the
`angular-bootstrap` plugin, the rule here wins.

## Readability

### Choose readability over brevity

**Rule:** Write each component so a person or an agent can read it top to bottom in its own file
and understand it. When readability conflicts with shorter code, fewer files or less
duplication, choose readability.
**Why:** The code is read far more often than it is written, often by agents with little context.
**When:** Always.

### Keep complexity low

**Rule:** Build with plain signals, inputs, outputs and services. No generic base classes,
controllers, or components configured by large option objects.
**Why:** Indirection hides behavior and makes a component impossible to read on its own.
**When:** Always.

### Extract shared code only at three copies with a clear name

**Rule:** Extract shared code only when there are three or more copies and the shared part has a
clear name of its own (`RowActions`, `CheckboxGroup`). Similar-looking code that reads clearly
where it is stays where it is; each list card keeps its own create, delete and reload logic.
**Why:** Premature abstractions couple unrelated components and are harder to read than the copies.
**When:** Whenever code looks duplicated.

### One concern per file

**Rule:** Keep each file about one thing. When a component mixes concerns (layout and data
formatting, say), move the pure logic to `src/app/utils/` with a spec.
**Why:** Pure functions are easy to test and keep components short.
**When:** Always.

### Name for behavior, comment the why

**Rule:** Name things for what they do, and write comments that explain why rather than what.
**Why:** The code already says what; the reason is what gets lost.
**When:** Always.

## Components

### Inputs and outputs are the only public members

**Rule:** A component's public members are its inputs and outputs. Everything its template uses is
`protected`, and everything else `private`.
**Why:** The class shows at a glance what a parent can bind to.
**When:** Every component.

## Forms

### Use Signal Forms with a submission action

**Rule:** Every form uses Signal Forms: `form(model, schema, { submission: { action: async () =>
this.save() } })`, bound with `<form [formRoot]>` and `[formField]`. The action delegates to a
private method that runs the request through a `requestStatus` (`utils/request-status.ts`).
**Why:** One form API, with submission, pending state and feedback handled the same way everywhere.
**When:** Every form.

### Edit forms follow their record through linkedSignal

**Rule:** An edit form takes its model from `linkedSignal(() => ({ ...this.item() }))`.
**Why:** The form follows the edited record without an `effect`.
**When:** Every form that edits an existing record.

### Put cross-field rules on the field that shows the error

**Rule:** Attach a cross-field rule to the field that displays the error, e.g.
`validate(path.confirmPassword, ...)`.
**Why:** `<mat-error>` then shows it without an `ErrorStateMatcher`.
**When:** Any validation that compares fields.

## Angular Material

### Theme only through styles.scss

**Rule:** Keep the single M3 theme in `src/styles.scss` (`mat.$cyan-palette` primary,
`mat.$orange-palette` tertiary, Roboto, density 0) and consume only `--mat-sys-*` variables in
components. Use `--app-success` for success states, since M3 has no success role.
`ThemeService` switches `color-scheme` on `html` between `light`, `dark` and `light dark`.
**Why:** One theme keeps light and dark schemes consistent; hard-coded colors break one of them.
**When:** All styling.

### Confirm through the Notifier, show errors inline

**Rule:** Show transient confirmations ("User alice created") through
`inject(Notifier).show(message)` (`src/app/services/notifier.service.ts`), never `MatSnackBar`
directly. Errors stay inline, next to what failed.
**Why:** One place controls snack bar behavior; inline errors keep the context of the failure.
**When:** Every success confirmation and error.

### Use the shared building blocks

**Rule:** Use the global classes in `src/styles.scss` for section cards (`.section-card`,
`.card-header-container`, `.card-content`) and dialog forms (`.dialog-form`, `.form-stack`), and
the components in `src/app/components/` (`ListCard`, `EditDialog`, `confirmDelete`,
`RowActions`, `CheckboxGroup`, `Skeleton`, `RequestFeedback`) with `requestStatus` and
`resourceDataSource` from `utils/`. Import table directives through `MAT_TABLE` from
`src/app/utils/material-table.ts`.
**Why:** Restyling or rewiring the same thing per component drifts in look and behavior.
**When:** Whenever a component needs a card, list, dialog, delete, loading or feedback state.

### Size cards by their content

**Rule:** Cards are as tall as their content and as wide as it needs. Each page lays its cards
out in its own grid (wide tables in a main column, short reference lists in a narrow one).
**Why:** Fixed heights clip or pad content, and equal widths waste space for short lists.
**When:** Every card. Never give cards fixed heights or equal widths.

### Create and edit records in dialogs

**Rule:** A list card shows only its list. Records are created and edited in a `MatDialog`: the
list card opens it with `dialog.open(Dialog, { data })` and, from `afterClosed()`, reloads its
list and confirms with the `Notifier`. A dialog injects `MAT_DIALOG_DATA`, uses
`<app-edit-dialog>` as its template root, and closes with the saved record's name, or nothing
when cancelled.
**Why:** Lists stay compact, and the close value tells the list card whether to reload.
**When:** Every create and edit flow. Dialog defaults (width, full screen on phones) come from
`app.config.ts`; don't set them per dialog.

### Cancel dialogs with undefined

**Rule:** Cancel buttons use `[mat-dialog-close]="undefined"`.
**Why:** A bare `mat-dialog-close` closes with `''`, which reads as a save.
**When:** Every dialog cancel button.

### Ask before every delete

**Rule:** Every delete asks first, through `confirmDelete(dialog, 'user alice')`.
**Why:** Deletes cannot be undone.
**When:** Every delete.

### Match the loading indicator to the situation

**Rule:** Show skeletons on first load or a parameter change (`ListCard` and `CheckboxGroup` do
this for you), a progress bar while data on screen reloads, and small spinners only beside the
control that started a request. Every skeleton shows through `skeletonVisible`
(`utils/skeleton-visible.ts`).
**Why:** `skeletonVisible` keeps a skeleton up for a minimum time so a fast load does not flicker.
**When:** Every loading state.

## API clients

### Never edit generated clients or vendored specs

**Rule:** Regenerate `src/app/services/admin` and `src/app/services/auth-basic` with
`make codegen` rather than editing them, and keep the specs in `openapi/` byte-identical with
upstream Kerberos.
**Why:** Hand edits are lost on the next codegen, and a drifted spec no longer describes the API.
**When:** Always.

### Import from the client's own directory

**Rule:** Import generated classes from `services/admin` or `services/auth-basic` directly, never
through a barrel that merges them.
**Why:** Both clients export classes with the same names (`UsersService`, `User`, `Group`).
**When:** Every import of generated code.

## Testing

### Drive components through the DOM

**Rule:** Specs drive components through the DOM (helpers in `src/testing/dom.ts`) rather than
their internals.
**Why:** Tests then check what users see and survive refactors of private members.
**When:** Every component spec.

### Check every page for accessibility

**Rule:** Every page spec calls `expectNoAxeViolations` from `src/testing/axe.ts`.
**Why:** Catches accessibility regressions before they ship.
**When:** Every spec under `src/app/pages/`.
