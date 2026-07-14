# NIBRRAS / نِبراس

NIBRRAS is an Arabic-first personal AI control console combining chat, adaptive learning, deep search, automation, and a unified control center.

## Development

- `pnpm install`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm --filter @workspace/api-server run dev`

## Architecture

- pnpm workspaces
- Node.js 24
- TypeScript 5.9
- Express 5
- PostgreSQL with Drizzle ORM
- Zod validation
- OpenAPI code generation with Orval

## Repository structure

- `artifacts/nibrras` — main NIBRRAS application
- `artifacts/api-server` — API server
- `lib` — shared libraries and API packages
- `scripts` — development and deployment scripts
- `.github/workflows` — CI and security workflows

## Canonical naming

The official product and repository name is **NIBRRAS**. Lowercase `nibrras` is used only where package names, paths, or technical identifiers require lowercase characters.
