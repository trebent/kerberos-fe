You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Required skills

This repo relies on the skills in the [`angular-bootstrap`](https://github.com/maansaake/angular-bootstrap) plugin. Install it in Claude Code with:

```
/plugin marketplace add maansaake/angular-bootstrap
/plugin install angular-bootstrap@angular-bootstrap
```

- `angular-project-structure`: directory layout, Angular rules, forms, services, API clients, accessibility and verification. It overrides the folder examples in `angular-developer`
- `angular-developer`: general Angular best practices
- `angular-material`: Angular Material work

## Project documentation

Read these before planning a change, and keep them in sync with it:

- `docs/overview.md`: what the app is and how it is built
- `docs/structure.md`: the directory map, and the files that need care before editing
- `docs/design-rules.md`: the project's design conventions. Where they conflict with a skill, they win

## Verification

- Format: `make format` (CI runs `make format/check`)
- Build: `make build/prod`
- Lint: `make lint` (CI runs `make lint/ci`)
- Test: `make test`
- `make check` runs the CI sequence in one go
