import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs"
import { join, resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import process from "process"

interface PackageJson {
  name: string
  version: string
  optionalDependencies?: Record<string, string>
  dependencies?: Record<string, string>
  [key: string]: any
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, "..")
const labsDir = join(rootDir, ".labs")

function getTimestampForFileName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

function collectMarkdownFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    const relativePath = fullPath.slice(rootDir.length + 1).replaceAll("\\", "/")

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".labs") {
        continue
      }
      files.push(...collectMarkdownFiles(fullPath))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (!entry.name.toLowerCase().endsWith(".md")) {
      continue
    }

    files.push(relativePath)
  }

  return files
}

function createMarkdownAggregationFile(version: string): string {
  mkdirSync(labsDir, { recursive: true })

  const timestamp = getTimestampForFileName()
  const outputFileName = `release-md-index-${version}-${timestamp}.md`
  const outputPath = join(labsDir, outputFileName)

  const markdownFiles = collectMarkdownFiles(rootDir).sort((a, b) => a.localeCompare(b))

  const sections: string[] = []
  sections.push(`# Markdown aggregation for release ${version}`)
  sections.push("")
  sections.push(`Generated at: ${new Date().toISOString()}`)
  sections.push(`Total files: ${markdownFiles.length}`)

  for (const relativePath of markdownFiles) {
    const fullPath = join(rootDir, relativePath)
    const stats = statSync(fullPath)
    const content = readFileSync(fullPath, "utf8")
    sections.push("")
    sections.push(`## ${relativePath}`)
    sections.push("")
    sections.push(`- Size: ${stats.size} bytes`)
    sections.push("")
    sections.push("```md")
    sections.push(content)
    sections.push("```")
  }

  writeFileSync(outputPath, sections.join("\n"))
  return outputPath
}

const args = process.argv.slice(2)
let version = args.find((arg) => !arg.startsWith("--"))

if (!version) {
  console.error("Error: Please provide a version number")
  console.error("Usage: bun scripts/prepare-release.ts <version>")
  console.error("Example: bun scripts/prepare-release.ts 0.2.0")
  console.error("         bun scripts/prepare-release.ts '*' (auto-increment patch)")
  process.exit(1)
}

// Handle auto-increment case
if (version === "*") {
  try {
    const corePackageJsonPath = join(rootDir, "packages", "core", "package.json")
    const corePackageJson: PackageJson = JSON.parse(readFileSync(corePackageJsonPath, "utf8"))
    const currentVersion = corePackageJson.version

    // Parse current version and increment patch
    const versionParts = currentVersion.split(".")
    if (versionParts.length !== 3) {
      console.error(`Error: Invalid current version format: ${currentVersion}`)
      process.exit(1)
    }

    const major = parseInt(versionParts[0])
    const minor = parseInt(versionParts[1])
    const patch = parseInt(versionParts[2]) + 1

    version = `${major}.${minor}.${patch}`
    console.log(`Auto-incrementing version from ${currentVersion} to ${version}`)
  } catch (error) {
    console.error(`Error: Failed to read current version: ${error}`)
    process.exit(1)
  }
}

if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version)) {
  console.error(`Error: Invalid version format: ${version}`)
  console.error("Version should follow semver format (e.g., 1.0.0, 1.0.0-beta.1)")
  process.exit(1)
}

console.log(`\nPreparing release ${version} for core, react, solid, and create-cascade packages...\n`)
try {
  const aggregationPath = createMarkdownAggregationFile(version)
  const relativeAggregationPath = aggregationPath.slice(rootDir.length + 1).replaceAll("\\", "/")
  console.log(`Created markdown aggregation file: ${relativeAggregationPath}`)
} catch (error) {
  console.error(`Failed to create markdown aggregation file: ${error}`)
  process.exit(1)
}

const corePackageJsonPath = join(rootDir, "packages", "core", "package.json")
const nativePackageDirs = [
  "core-darwin-arm64",
  "core-darwin-x64",
  "core-linux-arm64",
  "core-linux-x64",
  "core-win32-arm64",
  "core-win32-x64",
]
console.log("Updating @cascadetui/core...")

try {
  const corePackageJson: PackageJson = JSON.parse(readFileSync(corePackageJsonPath, "utf8"))

  corePackageJson.version = version

  if (corePackageJson.optionalDependencies) {
    for (const depName in corePackageJson.optionalDependencies) {
      if (depName.startsWith("@cascadetui/core-")) {
        corePackageJson.optionalDependencies[depName] = version
        console.log(`  Updated ${depName} to ${version}`)
      }
    }
  }

  writeFileSync(corePackageJsonPath, JSON.stringify(corePackageJson, null, 2) + "\n")
  console.log(`  @cascadetui/core updated to version ${version}`)
} catch (error) {
  console.error(`  Failed to update @cascadetui/core: ${error}`)
  process.exit(1)
}

console.log("\nUpdating @cascadetui/core-* native packages...")
for (const dir of nativePackageDirs) {
  const nativePackageJsonPath = join(rootDir, "packages", dir, "package.json")
  try {
    const nativePackageJson: PackageJson = JSON.parse(readFileSync(nativePackageJsonPath, "utf8"))
    nativePackageJson.version = version
    writeFileSync(nativePackageJsonPath, JSON.stringify(nativePackageJson, null, 2) + "\n")
    console.log(`  @cascadetui/${dir} updated to version ${version}`)
  } catch (error) {
    console.error(`  Failed to update @cascadetui/${dir}: ${error}`)
    process.exit(1)
  }
}

const reactPackageJsonPath = join(rootDir, "packages", "react", "package.json")
console.log("\nUpdating @cascadetui/react...")

try {
  const reactPackageJson: PackageJson = JSON.parse(readFileSync(reactPackageJsonPath, "utf8"))

  reactPackageJson.version = version

  writeFileSync(reactPackageJsonPath, JSON.stringify(reactPackageJson, null, 2) + "\n")
  console.log(`  @cascadetui/react updated to version ${version}`)
  console.log(`  Note: @cascadetui/core dependency will be set to ${version} during build`)
} catch (error) {
  console.error(`  Failed to update @cascadetui/react: ${error}`)
  process.exit(1)
}

const solidPackageJsonPath = join(rootDir, "packages", "solid", "package.json")
console.log("\nUpdating @cascadetui/solid...")

try {
  const solidPackageJson: PackageJson = JSON.parse(readFileSync(solidPackageJsonPath, "utf8"))

  solidPackageJson.version = version

  writeFileSync(solidPackageJsonPath, JSON.stringify(solidPackageJson, null, 2) + "\n")
  console.log(`  @cascadetui/solid updated to version ${version}`)
  console.log(`  Note: @cascadetui/core dependency will be set to ${version} during build`)
} catch (error) {
  console.error(`  Failed to update @cascadetui/solid: ${error}`)
  process.exit(1)
}

const createCascadePackageJsonPath = join(rootDir, "packages", "create-cascade", "package.json")
console.log("\nUpdating create-cascade...")

try {
  const createCascadePackageJson: PackageJson = JSON.parse(readFileSync(createCascadePackageJsonPath, "utf8"))
  createCascadePackageJson.version = version
  writeFileSync(createCascadePackageJsonPath, JSON.stringify(createCascadePackageJson, null, 2) + "\n")
  console.log(`  create-cascade updated to version ${version}`)
} catch (error) {
  console.error(`  Failed to update create-cascade: ${error}`)
  process.exit(1)
}

console.log("\nUpdating bun.lock...")
try {
  execSync("bun install", { cwd: rootDir, stdio: "inherit" })
  console.log("  bun.lock updated successfully")
} catch (error) {
  console.error(`  Failed to update bun.lock: ${error}`)
  process.exit(1)
}

console.log(`
Successfully prepared release ${version} for core, react, solid, and create-cascade packages!

Next steps:
1. Review the changes: git diff
2. Build the packages: bun run build
3. Commit the changes: git add -A && git commit -m "Release v${version}" && git push
4. Publish to npm: bun run publish
5. Push to GitHub: git push
  `)
