# Cascade Docs (Next.js)

## Local development

```bash
bun install
cd packages/web
bun run dev
```

## Build

```bash
cd packages/web
bun run build
```

## Vercel launch

1. Import repository in Vercel.
2. Set Root Directory to `packages/web`.
3. Framework preset: Next.js.
4. Build command: `next build` (default).
5. Install command: `bun install`.

The app uses App Router and deploys directly with Next.js runtime on Vercel.

# Contributing

If you want to contribute to the docs, you can do so by editing `lib/docs-data.tsx`. Make sure to follow the existing style and formatting.