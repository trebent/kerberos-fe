# Kerberos administration frontend

[![Main branch protection](https://github.com/trebent/kerberos-fe/actions/workflows/main.yaml/badge.svg)](https://github.com/trebent/kerberos-fe/actions/workflows/main.yaml)
[![Code scanning](https://github.com/trebent/kerberos-fe/actions/workflows/code-scanning.yaml/badge.svg)](https://github.com/trebent/kerberos-fe/actions/workflows/code-scanning.yaml)

Angular SPA for the [Kerberos](https://github.com/maansaake/kerberos) API gateway administration endpoints.

## Development

Use the Node version in `.nvmrc`, then:

```sh
make install      # npm ci
make serve        # dev server on http://localhost:4200, API at http://localhost:30001
make check        # format check, lint, production build and tests, as CI runs them
```

| Target                               | What it does                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `make format` / `make format/check`  | Format with Prettier, or only check                                                                      |
| `make lint` / `make lint/ci`         | ESLint with fixes, or only report                                                                        |
| `make build/prod` / `make build/dev` | Production or development build                                                                          |
| `make test`                          | Unit tests (Vitest)                                                                                      |
| `make codegen`                       | Regenerate the API clients in `src/app/services/admin` and `src/app/services/auth-basic` from `openapi/` |
| `make serve/staging`                 | Dev server against the staging configuration, with local certificates                                    |

The API specs in `openapi/` are vendored from Kerberos and must stay byte-identical with
upstream; regenerate the clients rather than editing them. `AGENTS.md` describes the code
conventions and `docs/structure.md` maps the source tree.
