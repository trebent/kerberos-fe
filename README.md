# kerberos-fe

Angular SPA for the [Kerberos](https://github.com/maansaake/kerberos) API gateway — provides a UI for all admin and auth-basic endpoints.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Angular 21 (standalone components + Signals) |
| Design system | Angular Material (Azure/Blue theme) |
| API clients | Generated via `openapi-generator-cli` (`typescript-angular`) |
| State | Angular Signals only |
| Auth | Session header (`x-krb-session`) via `HttpInterceptor` |

## Development

### Prerequisites

- Node 24+, npm 10+
- Java 11+ (for `openapi-generator-cli`)

### Install

```sh
npm ci
```

### Run locally

```sh
npm start
```

## Commands

| Command | Description |
|---|---|
| `make codegen` | Regenerate typed API clients from OAS specs |
| `make lint` | Run ESLint |
| `make build` | Production build |
| `make test` | Run unit tests (headless) |

## API client codegen

Typed clients are generated from the Kerberos OAS specs:

| OAS spec | Output |
|---|---|
| `openapi/admin.yaml` | `src/app/api/admin/` |
| `openapi/auth_basic.yaml` | `src/app/api/auth-basic/` |

After updating a spec, run `make codegen` and commit the generated files.

## Routing structure

```
/login                                              Public login page
/ (shell — requires session)
  /users                                            User list
  /users/:id                                        User detail
  /groups                                           Group list
  /groups/:id                                       Group detail
  /permissions                                      Permissions
  /debug/:backend/sessions                          Debug session list
  /debug/:backend/sessions/:id                      Debug session detail
  /debug/:backend/sessions/:id/calls                Session calls
  /flow                                             Flow viewer
  /oas/:backend                                     Backend OAS viewer
  /auth-basic/organisations                         Organisation list
  /auth-basic/organisations/:orgId                  Organisation detail
  /auth-basic/organisations/:orgId/users            Org user list
  /auth-basic/organisations/:orgId/users/:userId    Org user detail
  /auth-basic/organisations/:orgId/groups           Org group list
  /auth-basic/organisations/:orgId/groups/:groupId  Org group detail
```

## Project structure

```
src/app/
├── core/
│   ├── auth/                  AuthService (signals), AuthGuard
│   └── interceptors/          SessionInterceptor (x-krb-session header)
├── api/
│   ├── admin/                 Generated admin API client
│   └── auth-basic/            Generated auth-basic API client
├── features/
│   ├── login/                 Login page
│   ├── users/                 Admin user management
│   ├── groups/                Admin group management
│   ├── permissions/           Permissions viewer
│   ├── debug/                 Debug sessions + calls
│   ├── flow/                  Flow viewer
│   ├── oas/                   Backend OAS viewer
│   └── auth-basic/            Auth Basic (orgs, org-users, org-groups)
└── shared/
    ├── shell/                 App shell (sidenav + toolbar)
    └── components/
        ├── page-header/       Reusable page title component
        └── error-display/     APIErrorResponse display component
```
