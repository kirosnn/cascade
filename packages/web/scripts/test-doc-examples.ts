#!/usr/bin/env bun
/**
 * Creates a scaffold environment for testing documentation examples.
 *
 * Usage:
 *   bun scripts/test-doc-examples.ts [dir]
 *
 * This creates a directory with @cascade/core installed where you can
 * copy-paste code examples from the docs to verify they work.
 */

import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const DEFAULT_DIR = "/tmp/cascade-test"

async function main() {
  const targetDir = process.argv[2] || DEFAULT_DIR

  console.log(`Setting up test environment in: ${targetDir}\n`)

  // Create directory
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true })
  }

  // Initialize bun project
  console.log("Initializing project...")
  const init = Bun.spawnSync(["bun", "init", "-y"], {
    cwd: targetDir,
    stdout: "pipe",
    stderr: "pipe",
  })
  if (init.exitCode !== 0) {
    console.error("Failed to init:", new TextDecoder().decode(init.stderr))
    process.exit(1)
  }

  // Install @cascade/core
  console.log("Installing @cascade/core...")
  const install = Bun.spawnSync(["bun", "add", "@cascade/core"], {
    cwd: targetDir,
    stdout: "pipe",
    stderr: "pipe",
  })
  if (install.exitCode !== 0) {
    console.error("Failed to install:", new TextDecoder().decode(install.stderr))
    process.exit(1)
  }

  // install @cascade/solid
  console.log("Installing @cascade/solid...")
  const installSolid = Bun.spawnSync(["bun", "add", "@cascade/solid"], {
    cwd: targetDir,
    stdout: "pipe",
    stderr: "pipe",
  })
  if (installSolid.exitCode !== 0) {
    console.error("Failed to install:", new TextDecoder().decode(installSolid.stderr))
    process.exit(1)
  }

  // Create a template file
  const template = `import { createCliRenderer, Text, Box } from "@cascade/core"

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
})

// Paste your example code here
renderer.root.add(
  Text({
    content: "Hello, Cascade!",
    fg: "#00FF00",
  }),
)
`

  await Bun.write(join(targetDir, "test.ts"), template)

  console.log(`
Done! Test environment ready.

To test an example:
  1. Edit ${targetDir}/test.ts
  2. Run: bun ${targetDir}/test.ts
  3. Press Ctrl+C to exit

Or:
  cd ${targetDir}
  bun test.ts
`)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
