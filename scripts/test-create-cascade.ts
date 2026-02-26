import { existsSync, mkdirSync } from "node:fs"
import { join, resolve, dirname } from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, "..")
const labsDir = join(rootDir, ".labs")
const cliPath = join(rootDir, "packages", "create-cascade", "index.js")

if (!existsSync(labsDir)) {
  mkdirSync(labsDir, { recursive: true })
}

if (!process.stdin.isTTY) {
  console.error("[create-cascade] test:create must be run in an interactive terminal.")
  console.error("[create-cascade] Run this command manually to use the real wizard flow.")
  process.exit(1)
}

console.log(`[create-cascade] Running interactive CLI in: ${labsDir}`)
console.log("[create-cascade] This is the same flow as: bun create cascade")

const result = spawnSync("bun", [cliPath], {
  cwd: labsDir,
  stdio: "inherit",
  shell: process.platform === "win32",
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
