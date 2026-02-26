import { execSync, spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"

interface PackageJson {
  name: string
  version: string
}

const rootDir = process.cwd()
const args = process.argv.slice(2)
const isDryRun = args.includes("--dry-run")
const allowDirty = args.includes("--allow-dirty")

function run(command: string): void {
  if (isDryRun) {
    console.log(`[dry-run] ${command}`)
    return
  }
  execSync(command, { cwd: rootDir, stdio: "inherit" })
}

function assertCommand(command: string, testArgs: string[] = ["--version"]): void {
  const result = spawnSync(command, testArgs, { stdio: "ignore", shell: process.platform === "win32" })
  if (result.status !== 0) {
    throw new Error(`Missing required command: ${command}`)
  }
}

function readPackageVersion(packageDir: string): string {
  const packageJsonPath = join(rootDir, packageDir, "package.json")
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson
  return packageJson.version
}

function assertVersionsMatch(): string {
  const coreVersion = readPackageVersion("packages/core")
  const reactVersion = readPackageVersion("packages/react")
  const solidVersion = readPackageVersion("packages/solid")
  const createCascadeVersion = readPackageVersion("packages/create-cascade")

  if (coreVersion !== reactVersion || coreVersion !== solidVersion || coreVersion !== createCascadeVersion) {
    throw new Error(
      `Version mismatch: core=${coreVersion}, react=${reactVersion}, solid=${solidVersion}, create-cascade=${createCascadeVersion}`,
    )
  }

  return coreVersion
}

function assertGitClean(): void {
  const status = execSync("git status --porcelain", { cwd: rootDir }).toString().trim()
  if (status.length > 0) {
    if (allowDirty) {
      console.warn("WARNING: Git working tree is not clean; continuing because --allow-dirty is set")
      return
    }
    throw new Error("Git working tree is not clean. Commit/stash changes or run with --allow-dirty")
  }
}

function main(): void {
  try {
    assertCommand("bun")
    assertCommand("npm")
    assertCommand("git")
    assertCommand("gh")

    const version = assertVersionsMatch()
    const tag = `v${version}`

    assertGitClean()

    run("bun run pre-publish")
    run("bun run publish:core")
    run("bun run publish:react")
    run("bun run publish:solid")
    run("bun run publish:create")

    const tagCheck = spawnSync("git", ["rev-parse", "--verify", tag], {
      cwd: rootDir,
      stdio: "ignore",
      shell: process.platform === "win32",
    })

    if (tagCheck.status !== 0) {
      run(`git tag ${tag}`)
    }

    run(`git push origin ${tag}`)
    run(`gh release create ${tag} --generate-notes --verify-tag --latest`)

    console.log(`Release completed for ${tag}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
