# Project structure

This app follows the layout in the `angular-project-structure` skill from the
[`angular-bootstrap`](https://github.com/maansaake/angular-bootstrap) plugin. The directories,
their purpose and the placement rules are defined there. This page maps that layout onto this app.

```text
src/app/
  app.ts, app.html, app.scss   root component: skip link, header, <router-outlet>, footer
  app.config.ts                providers: router, HTTP, API clients, theme, session restore
  app.routes.ts                lazy routes and guards
  core/                        app-wide pieces, wired up once by the root files
    header/                    app shell, rendered on every page
    footer/
    guards/                    route guards (authGuard, guestGuard)
    interceptors/              HTTP interceptors (credentials + CSRF header)
  pages/                       one directory per navigable route
    login/
    flow/
      components/              debug, flow-pipeline, oas
    user-mgmt/
      components/              profile, users, user-edit, groups, group-edit, permissions-list
    auth-basic/
      components/              organisations-list, org-users-list, org-user-detail, org-groups-list,
                               rename-panel
  components/                  shared components used by two or more pages
    edit-panel/                card with a heading and close button around an edit form
    error-display/             lists error messages and announces them
    filtered-table/            filter field and paginator around a projected mat-table
    list-card/                 card for one kind of record: create section above the list
    password-change/           current/new/confirm password form
    request-feedback/          shows a requestStatus's error or success message
    row-actions/               a table row's edit and delete buttons
  services/                    all services, hand-written and generated
    auth.service.ts
    theme.service.ts           light/dark/system preference, saved in localStorage
    admin/                     generated from openapi/admin.yaml
    auth-basic/                generated from openapi/auth_basic.yaml
  utils/                       plain functions and classes, no components or services
    id-selection.ts            IdSelection, the ticked IDs of a checkbox list
    material-table.ts          MAT_TABLE imports, resourceDataSource
    names.ts                   joinNames, for name lists in table cells
    request-status.ts          requestStatus, runs a request and tracks its outcome
    validation.ts              password match validator and error state matcher
src/testing/                   test helpers: AuthService stub, axe-core check
openapi/                       API specs the clients are generated from (vendored from Kerberos)
```
