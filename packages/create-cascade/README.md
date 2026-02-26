# Create Cascade App

A CLI tool to create Cascade projects with interactive framework and starter selection.

## Quick Start

```bash
bun create cascade
```

## Features

- Create in a new folder or directly in the current folder
- Interactive framework selection (`core`, `react`, `solid`)
- Multiple built-in starter code presets per framework
- Scaffold only by default (no install, no auto-run)

## Frameworks

- `core`: Vanilla Cascade API
- `react`: Cascade + React renderer
- `solid`: Cascade + Solid renderer

## Starter Presets

### Core

- `minimal`
- `counter`
- `layout`

### React

- `minimal`
- `counter`
- `login`

### Solid

- `minimal`
- `counter`
- `input`

## CLI Options

```txt
Options:
  -f, --framework <name>  Framework: core, react, solid
  -s, --starter <name>    Starter preset for selected framework
  --here                  Use current directory
  --install               Run bun install after scaffolding
  --start                 Run bun install, then bun run dev
  -h, --help              Show help
```

## Examples

```bash
# Interactive mode
bun create cascade

# Create in current folder
bun create cascade --here

# Create React app with counter starter
bun create cascade my-app -f react -s counter

# Scaffold then install
bun create cascade my-app --install
```

## Behavior

- By default, the CLI only scaffolds files.
- With `--install`, it runs `bun install` in the target directory.
- With `--start`, it runs `bun install` then `bun run dev`.

## Package

Published on npm as `create-cascade`.
