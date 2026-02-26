#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parseArgs(argv) {
  const args = argv.slice(2)
  const options = {
    noInstall: false,
  }
  const positionals = []

  for (const arg of args) {
    if (arg === "--no-install") {
      options.noInstall = true
      continue
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true
      continue
    }
    positionals.push(arg)
  }

  return { options, positionals }
}

function printHelp() {
  console.log("Usage: bun create cascade [project-name] [--no-install]")
  console.log("")
  console.log("Examples:")
  console.log("  bun create cascade")
  console.log("  bun create cascade my-app")
  console.log("  bun create cascade my-app --no-install")
}

function ensureDirectoryIsEmpty(targetDir) {
  if (!existsSync(targetDir)) {
    return
  }
  const files = readdirSync(targetDir)
  if (files.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDir}`)
  }
}

function normalizePackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "cascade-app"
}

function writeTemplate(targetDir, projectName) {
  const templateDir = join(__dirname, "template")
  cpSync(templateDir, targetDir, { recursive: true })

  const packageJsonPath = join(targetDir, "package.json")
  const packageJsonRaw = readFileSync(packageJsonPath, "utf8")
  const packageJson = JSON.parse(packageJsonRaw)
  packageJson.name = normalizePackageName(projectName)
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

function main() {
  try {
    const { options, positionals } = parseArgs(process.argv)
    if (options.help) {
      printHelp()
      return
    }

    const projectName = positionals[0] ?? "cascade-app"
    const targetDir = resolve(process.cwd(), projectName)

    mkdirSync(targetDir, { recursive: true })
    ensureDirectoryIsEmpty(targetDir)
    writeTemplate(targetDir, projectName)

    console.log("")
    console.log(`Created project in ${targetDir}`)
    console.log("")
    console.log("Next steps:")
    if (projectName !== ".") {
      console.log(`  cd ${projectName}`)
    }
    if (options.noInstall) {
      console.log("  bun install")
    } else {
      console.log("  bun install")
    }
    console.log("  bun run dev")
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
