# Overview

Kerberos FE is the administration frontend for [Kerberos](https://github.com/maansaake/kerberos),
an API gateway. It is an Angular single-page app for the people who run a Kerberos deployment:
they sign in, inspect how the gateway handles requests, and manage who may do what.

## What it does

The app has three pages behind a login, each a lazy route:

- **Flow** (`/flow`): the gateway's request pipeline, stage by stage. For a chosen backend it
  shows the backend's OpenAPI spec and lets an administrator start debug sessions, which record
  real calls; picking a recorded call shows how each pipeline stage handled it.
- **Users** (`/user-mgmt`): the gateway's own administrators, their groups, and the permissions
  each group grants. An administrator can reset another administrator's password.
- **Basic authentication** (`/auth-basic`): organisations configured for Kerberos's basic
  authentication, and the users and groups inside each one. An administrator can reset a
  user's password.

A header with navigation, a color-theme menu and an account menu (change username or password,
log out) and a footer frame every page. Kerberos ends all of a user's sessions when their
password changes, so after changing your own password the app signs you in again with the new
one.

Every form that sets a new password checks that it is 10 to 64 characters, as Kerberos requires.

## How it is built

- **Two generated API clients.** Kerberos publishes OpenAPI specs for its admin API and its
  basic-auth API. They are vendored in `openapi/` and `make codegen` turns them into Angular
  clients in `src/app/services/admin` and `src/app/services/auth-basic`. The app never writes
  HTTP calls by hand.
- **Cookie sessions.** The browser holds the session and CSRF cookies; an HTTP interceptor sends
  credentials and echoes the CSRF token on every request. `AuthService` is the one owner of the
  session: it restores it on startup and refreshes it while the app is open. A regular user and
  the superuser sign in through different endpoints.
- **Signals throughout.** The app runs without zone.js. Components are standalone, read data
  through `resource`/`rxResource`, and keep state in signals. Forms use Signal Forms.
- **Angular Material 3.** One theme in `src/styles.scss`, a small set of shared building blocks
  (list cards, edit dialogs, delete confirmation, skeletons), and light, dark or system color
  schemes.

## Where to go next

- `docs/structure.md`: where every file lives and which ones need care.
- `docs/design-rules.md`: the conventions every change follows.
- `README.md`: how to install, run and build.
