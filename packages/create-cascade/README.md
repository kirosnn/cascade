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
- Optional direct install and immediate app start

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
  --no-install            Skip bun install
  --no-start              Skip bun run dev after install
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

# Scaffold only, no install
bun create cascade my-app --no-install
```

## Behavior

- If installation is enabled, the CLI runs `bun install` in the target directory.
- If installation is enabled and `--no-start` is not set, the CLI starts the app with `bun run dev`.

## Package

Published on npm as `create-cascade`.
