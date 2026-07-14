# NIBRRAS Repository Health Report

Date: 2026-07-14

## Scope

The complete monorepo, TypeScript project graph, build commands, package metadata, GitHub Actions workflows, runtime configuration, product naming, and user-facing documentation were inspected.

## Corrections

- Replaced the Unix-only root preinstall shell command with a cross-platform Node.js guard and pinned pnpm 10.15.1 consistently across local metadata and CI.
- Removed the invalid `allowBuilds` placeholder that caused pnpm installation failures.
- Restored the required Windows native packages in pnpm overrides so builds remain cross-platform while preserving the existing Linux runner policy.
- Corrected two incomplete return paths in the System page that failed `noImplicitReturns` TypeScript validation.
- Made `PORT` and `BASE_PATH` optional for production Vite builds, with safe defaults, while retaining validation for invalid port values.
- Expanded the Quality workflow to type-check and build the full monorepo and run all declared test scripts.
- Standardized internal package names from the generic scope to `@nibrras/*` and refreshed the lockfile.
- Standardized API routes, gateway variables, service types/functions, storage keys, webhook names, messages, and telemetry identifiers on NIBRRAS.
- Renamed the legacy assets directory to `nibrras_assets` and updated its Vite alias.
- Rewrote the README with setup, architecture, environment, CI, repository-map, and naming guidance.

## Naming exceptions

The strings `pnpm-workspace.yaml`, `workspace:*`, pnpm workspace terminology, Orval's `workspace` configuration property, TypeScript's `workspace` custom export condition, and editor file patterns remain because they are external tool syntax or generic technical terms. Changing them to a product name would break package resolution or configuration semantics.

## Verification

- `pnpm install --no-frozen-lockfile`: passed and lockfile updated.
- `pnpm run typecheck`: passed for all library, artifact, and script projects.
- `pnpm run build`: passed for the API server, main NIBRRAS application, and mockup sandbox.
- `pnpm run test`: passed; the current packages declare no dedicated test suites, so the recursive test command completes without omitted failing scripts.
- Legacy branded-name scan: no remaining occurrences of the deprecated product names or generic internal package scope.

## Pull request policy

The changes are delivered on a dedicated branch and the pull request is intentionally not merged.
