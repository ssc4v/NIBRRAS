# NIBRRAS | نبراس

NIBRRAS is an Arabic-first personal AI console for chat, adaptive learning, deep search, automation, and system control.

## Requirements

- Node.js 22 or newer
- pnpm 10.15.1 (declared in `package.json`)
- PostgreSQL when running database-backed API features

## Setup and verification

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm run test
```

Run the applications with:

```bash
pnpm --filter @nibrras/api-server run dev
pnpm --filter @nibrras/nibrras run dev
```

The Vite applications default to port `5173` and base path `/`. Set `PORT` and `BASE_PATH` to override them. Configure the gateway with the `NIBRRAS_GATEWAY_URL`, `NIBRRAS_AUTH_HEADER`, and `NIBRRAS_AUTH_VALUE` server variables; browser-specific values use the `VITE_NIBRRAS_*` prefix documented in `artifacts/nibrras/.env.example`.

## Repository map

- `artifacts/nibrras`: main React/Vite application
- `artifacts/api-server`: Express API server
- `artifacts/mockup-sandbox`: isolated component preview application
- `lib/api-*`: shared API contracts, generated clients, and validation
- `lib/db`: Drizzle/PostgreSQL schema and database helpers
- `nibrras_assets`: project reference assets
- `scripts`: repository automation
- `.github/workflows`: CI and sandbox workflows

## Architecture

The repository is a pnpm monorepo using TypeScript project references. The frontend uses React 19, Vite, and Tailwind CSS. The API uses Express 5, Zod contracts, Drizzle ORM, and an esbuild production bundle. Internal packages use the `@nibrras/*` scope.

## Continuous integration

The `Quality` workflow installs with the pinned pnpm version, type-checks and builds every package, and runs every declared test script. `NIBRRAS App CI` independently verifies and uploads the main frontend bundle. `NIBRRAS Sandbox` inspects explicitly supplied public repositories in a disposable runner with read-only repository permissions.

## Naming policy

`NIBRRAS` is the canonical product name. Lowercase `nibrras` is used only for URLs, paths, package identifiers, and environment variables where lowercase is conventional. Generic pnpm terms such as `pnpm-workspace.yaml` and the `workspace:*` dependency protocol remain unchanged because they are required tool syntax, not product branding.

## Change report

See [`docs/REPOSITORY_HEALTH_REPORT.md`](docs/REPOSITORY_HEALTH_REPORT.md) for the repository audit, fixes, naming migration, and verification results.
