import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageDir = resolve(__dirname, "..")

function resolveCommand(command: string) {
  if (process.platform === "win32" && (command === "npm" || command === "npx")) {
    return `${command}.cmd`
  }
  return command
}

type SpawnEnv = Record<string, string | undefined>

function run(command: string, args: string[], cwd: string, env?: SpawnEnv) {
  const resolvedCommand = resolveCommand(command)
  const resolvedEnv = env ? ({ ...process.env, ...env } as NodeJS.ProcessEnv) : process.env
  const result = spawnSync(resolvedCommand, args, {
    cwd,
    stdio: "inherit",
    env: resolvedEnv,
  })
  if (result.status !== 0) {
    throw new Error(`Command failed: ${resolvedCommand} ${args.join(" ")}`)
  }
}

function runPipe(command: string, args: string[], cwd: string, env?: SpawnEnv) {
  const resolvedCommand = resolveCommand(command)
  const resolvedEnv = env ? ({ ...process.env, ...env } as NodeJS.ProcessEnv) : process.env
  const result = spawnSync(resolvedCommand, args, {
    cwd,
    encoding: "utf8",
    env: resolvedEnv,
  })
  const stdout = (result.stdout ?? "").toString()
  const stderr = (result.stderr ?? "").toString()
  if (stdout.trim().length > 0) {
    console.log(stdout.trimEnd())
  }
  if (stderr.trim().length > 0) {
    console.error(stderr.trimEnd())
  }
  if (result.status !== 0) {
    const err = result.error ? `\nerror: ${String(result.error)}` : ""
    throw new Error(`Command failed: ${resolvedCommand} ${args.join(" ")}\n(tempRoot: ${cwd})${err}`)
  }
}

function runCapture(command: string, args: string[], cwd: string): string {
  const resolvedCommand = resolveCommand(command)
  const result = spawnSync(resolvedCommand, args, { cwd, encoding: "utf8" })
  if (result.status !== 0) {
    throw new Error(`Command failed: ${resolvedCommand} ${args.join(" ")}`)
  }
  return (result.stdout ?? "").toString().trim()
}

function assertFileExists(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Expected file to exist: ${path}`)
  }
}

const packageJson = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as {
  name: string
  version: string
}

console.log(`User-like test for ${packageJson.name}@${packageJson.version}`)

const tempRoot = mkdtempSync(join(tmpdir(), "cascade-skill-user-test-"))
const sandboxHome = join(tempRoot, "home")

let tgzPathToCleanup: string | undefined
let tgzTempPathToCleanup: string | undefined

try {
  const tgzName = runCapture("npm", ["pack", "--silent"], packageDir)
  const tgzPath = resolve(packageDir, tgzName)
  tgzPathToCleanup = tgzPath
  assertFileExists(tgzPath)

  const tgzTempPath = join(tempRoot, tgzName)
  copyFileSync(tgzPath, tgzTempPath)
  tgzTempPathToCleanup = tgzTempPath

  runPipe(
    "npm",
    ["install", "--no-save", "--no-package-lock", `./${tgzName}`],
    tempRoot
  )

  console.log("\nRunning: npx create-cascade-skill --list")
  run(
    "npx",
    ["--no-install", "create-cascade-skill", "--list", "--home", sandboxHome],
    tempRoot,
    { CASCADE_SKILL_HOME: sandboxHome }
  )

  console.log("\nRunning: npx create-cascade-skill --agents windsurf")
  run(
    "npx",
    ["--no-install", "create-cascade-skill", "--agents", "windsurf", "--home", sandboxHome],
    tempRoot,
    { CASCADE_SKILL_HOME: sandboxHome }
  )

  console.log("\nOK")
} finally {
  try {
    if (tgzPathToCleanup) {
      rmSync(tgzPathToCleanup, { force: true })
    }
    if (tgzTempPathToCleanup) {
      rmSync(tgzTempPathToCleanup, { force: true })
    }
  } catch {
    // ignore cleanup errors
  }
  if (process.env.KEEP_TEMP === "1") {
    console.log(`Keeping temp directory: ${tempRoot}`)
  } else {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}
