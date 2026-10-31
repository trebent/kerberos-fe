You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

For Angular best practices, follow the `angular-developer` skill (and `angular-material` for Angular Material work). This file records only the project rules that override or extend those skills.

## Project Structure

- Follow the directory layout in `docs/structure.md`; it overrides the folder examples in the `angular-developer` skill
- `core/` for the app shell (header, footer), `pages/` for routed components (sub-pages and page-only `components/` nested inside the page), `components/` for components shared by several pages, `services/` for all services

## Angular Rules

- Use standalone components over NgModules; do NOT set `standalone: true` (default in v20+) or `changeDetection: ChangeDetectionStrategy.OnPush` (default in v22+) in decorators
- Do NOT use the `@HostBinding` and `@HostListener` decorators; put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Implement lazy loading for feature routes
- Use `NgOptimizedImage` for all static images
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Forms

- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones

## Services

- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)

## API Clients

- All API clients are generated from OpenAPI specs in `openapi/` into `src/app/services/<api-name>` via `make codegen`. Generated output is committed.
- Do NOT hand-edit files under `src/app/services/<api-name>`; change the spec and regenerate instead.
- Register each generated client in `app.config.ts` via its `provideApi(...)` function with the environment base URL.
- Consume generated services with `inject(<Api>Service)`; do not hand-roll `HttpClient` calls for endpoints a generated client already covers.

## Verification

- Before declaring a change complete, run in order: **format -> build -> lint -> test**. All four must pass.
- Format: `make format` (Prettier; CI runs `make format/check`)
- Build: `make build/prod` (production `ng build`)
- Lint: `make lint` (`ng lint --fix`; CI runs `make lint/ci`)
- Test: `make test` (`ng test --watch false`)
- `make check` runs the CI sequence in one go.
- Every page spec must call `expectNoAxeViolations` from `src/testing/axe.ts`. jsdom cannot check color contrast, so verify contrast in a browser in both light and dark mode.
- A change is not complete until all steps pass. Read the output of each step; do not claim success without it. Fix failures before moving on.
