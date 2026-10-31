# Project structure

Every file under `src/app/` belongs in one of a fixed set of directories. The directory says what
a file is and who uses it, so you can find things without searching.

```text
src/app/
  app.ts, app.html, app.scss   root component: skip link, header, <router-outlet>, footer
  app.config.ts                providers: router, HTTP, API clients, session restore
  app.routes.ts                lazy routes and guards
  core/                        permanent page elements, rendered on every page
    header/
    footer/
  pages/                       one directory per navigable route
    login/
    flow/
      components/              components only the flow page uses
        debug/
        flow-pipeline/
        oas/
    user-mgmt/
      components/              profile, users, user-edit, groups, group-edit, permissions-list
    auth-basic/
      components/              organisations-list, organisation-detail, org-users-list,
                               org-user-detail, org-groups-list, org-group-detail
  components/                  shared components used by two or more pages
    error-display/
  services/                    all services, hand-written and generated
    auth.service.ts
    admin/                     generated from openapi/admin.yaml
    auth-basic/                generated from openapi/auth_basic.yaml
  guards/                      route guards (authGuard, guestGuard)
  interceptors/                HTTP interceptors (credentials + CSRF header)
  utils/                       plain functions and constants: validation, Material table imports
src/testing/                   test helpers: AuthService stub, axe-core check
```

## Directories

### `core/`

Components that are part of the app shell and stay on screen whatever the route: the header, the
footer and anything else of that kind (a site-wide banner, a navigation drawer). They are imported
by `app.ts` only, never by a page.

### `pages/`

One directory per component that a route loads with `loadComponent`. The directory name matches
the route path (`/user-mgmt` → `pages/user-mgmt/`), and `app.routes.ts` is the only file that
imports a page.

- **Sub-pages** (child routes) live in a directory inside their parent page, e.g.
  `pages/flow/debug/` for `/flow/debug`.
- **Page-only components** live in a `components/` directory inside the page that uses them, e.g.
  `pages/flow/components/flow-pipeline/`. If a second page needs one, move it to the top-level
  `components/`.

### `components/`

Shared, reusable components used by two or more pages. A component used by a single page belongs
under that page instead (see above).

### `services/`

Every injectable singleton service, hand-written or generated. Hand-written services sit at the top
level and use the `.service.ts` suffix. Generated OpenAPI clients each get their own directory
(`services/<api-name>/`), written by `make codegen`. Never hand-edit generated directories; change
the spec in `openapi/` and regenerate. Both generated clients export classes with the same names
(`UsersService`, `User`, `Group`), so always import from the client's directory
(`services/admin` or `services/auth-basic`).

### `guards/`, `interceptors/`, `utils/`

Non-component code, grouped by Angular role:

- `guards/`: functional route guards.
- `interceptors/`: functional HTTP interceptors.
- `utils/`: plain, framework-light functions and constants (no `@Component` or `@Service`).

## Rules

1. **One component per directory**, named after the component in kebab-case
   (`flow-pipeline/flow-pipeline.ts`) with its template, styles and spec beside it.
2. **Place a component by who uses it**: the app shell → `core/`; a route → `pages/`; one page →
   that page's `components/`; several pages → `components/`.
3. **Imports point down or across to shared code, never into another page.** A page may import
   from `components/`, `services/` and `utils/`, but not from another page's directory.
4. **Specs sit next to the file they test** (`*.spec.ts`).
