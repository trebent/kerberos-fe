# Project structure

This app follows the layout in the `angular-project-structure` skill from the
[`angular-bootstrap`](https://github.com/maansaake/angular-bootstrap) plugin. The directories,
their purpose and the placement rules are defined there. This page maps that layout onto this app.

```text
src/app/
  app.ts, app.html, app.scss   root component: skip link, header, <router-outlet>, footer
  app.config.ts                providers: router, HTTP, API clients, session restore
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
      components/              organisations-list, organisation-detail, org-users-list,
                               org-user-detail, org-groups-list, org-group-detail
  components/                  shared components used by two or more pages
    error-display/
  services/                    all services, hand-written and generated
    auth.service.ts
    admin/                     generated from openapi/admin.yaml
    auth-basic/                generated from openapi/auth_basic.yaml
  utils/                       validation rules, Material table imports
src/testing/                   test helpers: AuthService stub, axe-core check
openapi/                       API specs the clients are generated from (vendored from Kerberos)
```
