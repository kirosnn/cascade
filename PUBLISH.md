# Publishing Cascade Packages

This guide publishes the required npm packages from the `Cascade` monorepo.

## Published packages

- `@cascadetui/core`
- `@cascadetui/core-*` (native packages referenced by `@cascadetui/core`)
- `@cascadetui/react`
- `@cascadetui/solid`
- `create-cascade`

## Prerequisites

- Bun installed (`bun --version`)
- npm authenticated (`npm whoami`)
- Zig installed and available in `PATH` (`zig version`)
- (Optional) GitHub CLI for GitHub releases (`gh --version`)

## Prepare a version

Pick a semver version and apply it to `core/react/solid/create-cascade`:

```powershell
bun scripts/prepare-release.ts 0.1.2
```

Or auto-increment patch:

```powershell
bun scripts/prepare-release.ts *
```

## npm publish pipeline

From the repository root:

```powershell
bun run build
bun run pre-publish
bun run publish
```

This pipeline:

- builds `dist` artifacts
- validates npm auth, versions, and dependency consistency
- publishes `core`, its native packages, then `react`, `solid`, and `create-cascade`

## GitHub release (optional)

If `gh` is installed and configured:

```powershell
bun scripts/publish-and-release.ts
```

Dry run:

```powershell
bun scripts/publish-and-release.ts --dry-run
```

## Useful diagnostic commands

```powershell
git status --short
bun --version
npm --version
npm whoami
zig version
gh --version
```

## Common errors

- `Zig is not installed or not in PATH`:
  install Zig and verify with `zig version`.
- `Missing required command: gh`:
  install GitHub CLI or skip the GitHub release step.
- `NPM authentication failed` / `npm whoami` fails:
  re-authenticate with npm (`npm login`) or check `NPM_AUTH_TOKEN`.
- `dist directory not found`:
  run `bun run build` before `pre-publish`.

## Repo references

- `package.json`
- `scripts/pre-publish.ts`
- `scripts/prepare-release.ts`
- `scripts/publish-and-release.ts`
- `packages/core/scripts/publish.ts`
- `packages/react/scripts/publish.ts`
- `packages/solid/scripts/publish.ts`
- `packages/create-cascade/scripts/publish.ts`
