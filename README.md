# Cascade

**Fork of OpenTUI of anomalyco : https://github.com/anomalyco/opentui**

<div align="center">
    <a href="https://www.npmjs.com/package/@cascade/core"><img alt="npm" src="https://img.shields.io/npm/v/@cascade/core?style=flat-square" /></a>
    <a href="https://github.com/kirosnn/cascade/actions/workflows/build-core.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/kirosnn/cascade/build-core.yml?style=flat-square&branch=main" /></a>
    <a href="https://github.com/msmps/awesome-cascade"><img alt="awesome cascade list" src="https://awesome.re/badge-flat.svg" /></a>
</div>

Cascade is a native terminal UI core written in Zig with TypeScript bindings. The native core exposes a C ABI and can be used from any language. Cascade powers [OpenCode](https://opencode.ai) in production today and will also power [terminal.shop](https://terminal.shop). It is an extensible core with a focus on correctness, stability, and high performance. It provides a component-based architecture with flexible layout capabilities, allowing you to create complex terminal applications.

Docs: https://cascade.com/docs/getting-started

Quick start with [bun](https://bun.sh) and [create-tui](https://github.com/msmps/create-tui):

```bash
bun create tui
```

This monorepo contains the following packages:

- [`@cascade/core`](packages/core) - TypeScript bindings for Cascade's native Zig core, with an imperative API and all primitives.
- [`@cascade/solid`](packages/solid) - The SolidJS reconciler for Cascade.
- [`@cascade/react`](packages/react) - The React reconciler for Cascade.

## Install

NOTE: You must have [Zig](https://ziglang.org/learn/getting-started/) installed on your system to build the packages.

### TypeScript/JavaScript

```bash
bun install @cascade/core
```

## AI Agent Skill

Teach your AI coding assistant Cascade's APIs and patterns.

**For [OpenCode](https://opencode.ai) (includes `/cascade` command):**

```bash
curl -fsSL https://raw.githubusercontent.com/msmps/cascade-skill/main/install.sh | bash
```

**For other AI coding assistants:**

```bash
npx skills add msmps/cascade-skill
```

## Try Examples

You can quickly try out Cascade examples without cloning the repository:

**For macOS, Linux, WSL, Git Bash:**

```bash
curl -fsSL https://raw.githubusercontent.com/kirosnn/cascade/main/packages/core/src/examples/install.sh | sh
```

**For Windows (PowerShell/CMD):**

Download the latest release directly from [GitHub Releases](https://github.com/kirosnn/cascade/releases/latest)

## Running Examples (from the repo root)

### TypeScript Examples

```bash
bun install
cd packages/core
bun run src/examples/index.ts
```

## Development

See the [Development Guide](packages/core/docs/development.md) for building, testing, debugging, and local development linking.

### Documentation

- [Website docs](https://cascade.com/docs/getting-started) - Guides and API references
- [Development Guide](packages/core/docs/development.md) - Building, testing, and local dev linking
- [Getting Started](packages/core/docs/getting-started.md) - API and usage guide
- [Environment Variables](packages/core/docs/env-vars.md) - Configuration options

## Showcase

Consider showcasing your work on the [awesome-cascade](https://github.com/msmps/awesome-cascade) list. A curated list of awesome resources and terminal user interfaces built with Cascade.
