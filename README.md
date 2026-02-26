# Cascade

**Community fork of OpenTUI by anomalyco:** https://github.com/anomalyco/opentui

<div align="center">
    <a href="https://www.npmjs.com/package/@cascadetui/core"><img alt="npm" src="https://img.shields.io/npm/v/@cascadetui/core?style=flat-square" /></a>
    <a href="https://github.com/kirosnn/cascade/actions/workflows/build-core.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/kirosnn/cascade/build-core.yml?style=flat-square&branch=main" /></a>
</div>

Cascade is a native terminal UI foundation written in Zig with TypeScript bindings.
The core exposes a C ABI, so it can be integrated from any language.
It is designed for correctness, stability, extensibility, and performance, with a component-driven model and flexible layout primitives for building advanced terminal apps.

Documentation: https://cascade.com/docs/getting-started

Quick start (with [bun](https://bun.sh)):

```bash
bun create cascade
```

## Packages

This monorepo currently includes:

- [`@cascadetui/core`](packages/core): TypeScript bindings for the Zig native core and low-level primitives.
- [`@cascadetui/solid`](packages/solid): SolidJS reconciler for Cascade.
- [`@cascadetui/react`](packages/react): React reconciler for Cascade.
- [`create-cascade`](packages/create-cascade): Project scaffolding CLI with framework and starter selection.

## Installation

Prerequisite: install [Zig](https://ziglang.org/learn/getting-started/) on your machine before building packages.

### TypeScript / JavaScript

```bash
bun install @cascadetui/core
```

## Try the examples

You can run examples without cloning the repository.

### macOS, Linux, WSL, Git Bash

```bash
curl -fsSL https://raw.githubusercontent.com/kirosnn/cascade/main/packages/core/src/examples/install.sh | sh
```

### Windows (PowerShell / CMD)

Download the latest binary bundle from [GitHub Releases](https://github.com/kirosnn/cascade/releases/latest).

## Run examples from source

From the repository root:

```bash
bun install
cd packages/core
bun run src/examples/index.ts
```

## Development

For build, test, debugging, and local linking workflows, see the [Development Guide](packages/core/docs/development.md).

## Documentation Index

- [Website docs](https://cascade.com/docs/getting-started): Guides and API references.
- [Development Guide](packages/core/docs/development.md): Build, test, and local linking.
- [Getting Started](packages/core/docs/getting-started.md): Setup and API usage.
- [Environment Variables](packages/core/docs/env-vars.md): Runtime configuration.

## Showcase

If you build something with Cascade, consider adding it to [awesome-cascade](https://github.com/msmps/awesome-cascade), a curated collection of Cascade resources and terminal UI projects.
