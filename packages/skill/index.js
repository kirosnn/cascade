#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve, join } from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"
import { createInterface } from "node:readline/promises"
import { emitKeypressEvents } from "node:readline"

const ANSI_RESET = "\x1b[0m"
const ANSI_BOLD = "\x1b[1m"
const ANSI_DIM = "\x1b[2m"
const ANSI_CYAN = "\x1b[36m"
const ANSI_GREEN = "\x1b[32m"
const ANSI_YELLOW = "\x1b[33m"

function getHomeDirectory() {
  return process.env.HOME || process.env.USERPROFILE || process.cwd()
}

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where" : "which"
  const result = spawnSync(lookup, [command], { stdio: "ignore" })
  return result.status === 0
}

function parseAgentsArg(value) {
  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0)
}

function unique(items) {
  return [...new Set(items)]
}

function getAgents() {
  const home = getHomeDirectory()
  const appData = process.env.APPDATA || join(home, "AppData", "Roaming")

  return [
    {
      id: "codex",
      label: "OpenAI Codex",
      description: "Install in ~/.codex/skills/cascadetui/SKILL.md",
      commands: ["codex"],
      detectPaths: [join(home, ".codex")],
      installPath: join(home, ".codex", "skills", "cascadetui", "SKILL.md"),
      flavor: "codex",
    },
    {
      id: "claude-code",
      label: "Claude Code",
      description: "Install in ~/.claude/skills/cascadetui/SKILL.md",
      commands: ["claude"],
      detectPaths: [join(home, ".claude")],
      installPath: join(home, ".claude", "skills", "cascadetui", "SKILL.md"),
      flavor: "claude",
    },
    {
      id: "cursor",
      label: "Cursor",
      description: "Install in ~/.cursor/skills/cascadetui/SKILL.md",
      commands: ["cursor"],
      detectPaths: [join(home, ".cursor"), join(appData, "Cursor")],
      installPath: join(home, ".cursor", "skills", "cascadetui", "SKILL.md"),
      flavor: "cursor",
    },
    {
      id: "windsurf",
      label: "Windsurf",
      description: "Install in ~/.codeium/windsurf/skills/cascadetui/SKILL.md",
      commands: ["windsurf"],
      detectPaths: [join(home, ".codeium"), join(appData, "Codeium")],
      installPath: join(home, ".codeium", "windsurf", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "cline",
      label: "Cline",
      description: "Install in ~/.cline/skills/cascadetui/SKILL.md",
      commands: ["cline"],
      detectPaths: [join(home, ".cline")],
      installPath: join(home, ".cline", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "roo-code",
      label: "Roo Code",
      description: "Install in ~/.roo/skills/cascadetui/SKILL.md",
      commands: ["roo", "roo-code"],
      detectPaths: [join(home, ".roo"), join(home, ".roocode")],
      installPath: join(home, ".roo", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "continue",
      label: "Continue",
      description: "Install in ~/.continue/skills/cascadetui/SKILL.md",
      commands: ["continue"],
      detectPaths: [join(home, ".continue")],
      installPath: join(home, ".continue", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "aider",
      label: "Aider",
      description: "Install in ~/.aider/skills/cascadetui/SKILL.md",
      commands: ["aider"],
      detectPaths: [join(home, ".aider.conf.yml"), join(home, ".aider")],
      installPath: join(home, ".aider", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "gemini-cli",
      label: "Gemini CLI",
      description: "Install in ~/.gemini/skills/cascadetui/SKILL.md",
      commands: ["gemini"],
      detectPaths: [join(home, ".gemini")],
      installPath: join(home, ".gemini", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "openhands",
      label: "OpenHands",
      description: "Install in ~/.openhands/skills/cascadetui/SKILL.md",
      commands: ["openhands"],
      detectPaths: [join(home, ".openhands")],
      installPath: join(home, ".openhands", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "goose",
      label: "Goose",
      description: "Install in ~/.config/goose/skills/cascadetui/SKILL.md",
      commands: ["goose"],
      detectPaths: [join(home, ".config", "goose"), join(appData, "goose")],
      installPath: join(home, ".config", "goose", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
    {
      id: "ami",
      label: "Ami",
      description: "Install in ~/.ami/skills/cascadetui/SKILL.md",
      commands: ["ami"],
      detectPaths: [join(home, ".ami")],
      installPath: join(home, ".ami", "skills", "cascadetui", "SKILL.md"),
      flavor: "generic",
    },
  ]
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const options = {
    agents: [],
    allDetected: false,
    list: false,
    dryRun: false,
    help: false,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]

    if (arg === "--agents" || arg === "-a") {
      options.agents.push(...parseAgentsArg(args[i + 1] || ""))
      i += 1
      continue
    }
    if (arg.startsWith("--agents=")) {
      options.agents.push(...parseAgentsArg(arg.slice("--agents=".length)))
      continue
    }
    if (arg === "--all-detected") {
      options.allDetected = true
      continue
    }
    if (arg === "--list") {
      options.list = true
      continue
    }
    if (arg === "--dry-run") {
      options.dryRun = true
      continue
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  options.agents = unique(options.agents)
  return options
}

function printHelp() {
  console.log("Usage: npx create-cascade-skill [options]")
  console.log("")
  console.log("Options:")
  console.log("  -a, --agents <ids>    Comma-separated agent IDs to install")
  console.log("  --all-detected        Install for all detected agents")
  console.log("  --list                Print supported and detected agents")
  console.log("  --dry-run             Preview files without writing")
  console.log("  -h, --help            Show help")
  console.log("")
  console.log("Examples:")
  console.log("  npx create-cascade-skill")
  console.log("  npx create-cascade-skill --all-detected")
  console.log("  npx create-cascade-skill --agents codex,cursor,cline")
  console.log("  npx create-cascade-skill --agents codex --dry-run")
}

function detectAgents(agents) {
  return agents.map((agent) => {
    const commandHit = agent.commands.some((command) => commandExists(command))
    const pathHit = agent.detectPaths.some((path) => existsSync(path))
    return { ...agent, detected: commandHit || pathHit }
  })
}

function printList(agents) {
  console.log(`${ANSI_BOLD}Supported agents${ANSI_RESET}`)
  for (const agent of agents) {
    const marker = agent.detected ? `${ANSI_GREEN}detected${ANSI_RESET}` : `${ANSI_YELLOW}not detected${ANSI_RESET}`
    console.log(`- ${agent.id.padEnd(12)} ${marker}  ${agent.label}`)
  }

  const detected = agents.filter((agent) => agent.detected).map((agent) => agent.id)
  console.log("")
  if (detected.length > 0) {
    console.log(`Detected IDs: ${detected.join(", ")}`)
    console.log(`Install all detected: npx create-cascade-skill --agents ${detected.join(",")}`)
  } else {
    console.log("Detected IDs: none")
  }
}

function validateAgentIds(selected, agents) {
  const allowed = new Set(agents.map((agent) => agent.id))
  for (const id of selected) {
    if (!allowed.has(id)) {
      throw new Error(`Unknown agent id: ${id}`)
    }
  }
}

function promptLine(rl, label) {
  return rl.question(label)
}

function toSelectableOptions(agents) {
  return agents.map((agent) => ({
    id: agent.id,
    label: agent.label,
    description: `${agent.description}${agent.detected ? " [detected]" : ""}`,
  }))
}

async function selectMany(rl, label, options, preselectedIds) {
  if (!process.stdin.isTTY) {
    return preselectedIds
  }

  const stdin = process.stdin
  const stdout = process.stdout
  let selectedIndex = 0
  let selected = new Set(preselectedIds)
  const totalLines = options.length + 3
  let renderedOnce = false

  const render = () => {
    if (renderedOnce) {
      stdout.write(`\x1b[${totalLines}F`)
    } else {
      stdout.write("\n")
    }

    stdout.write(`${ANSI_BOLD}${label}${ANSI_RESET}\n`)
    for (let i = 0; i < options.length; i += 1) {
      const option = options[i]
      const isCursor = i === selectedIndex
      const isSelected = selected.has(option.id)
      const cursor = isCursor ? `${ANSI_BOLD}${ANSI_CYAN}>${ANSI_RESET}` : " "
      const mark = isSelected ? `${ANSI_GREEN}[x]${ANSI_RESET}` : "[ ]"
      const styleStart = isCursor ? `${ANSI_BOLD}${ANSI_CYAN}` : ""
      const styleEnd = isCursor ? ANSI_RESET : ""
      stdout.write(`${cursor} ${mark} ${styleStart}${option.label}${styleEnd} ${ANSI_DIM}(${option.id}) - ${option.description}${ANSI_RESET}\n`)
    }
    stdout.write(`${ANSI_DIM}Use Up/Down, Space to toggle, A to toggle all, Enter to confirm${ANSI_RESET}\n`)
    renderedOnce = true
  }

  return new Promise((resolvePromise, rejectPromise) => {
    const cleanup = () => {
      stdin.off("keypress", onKeyPress)
      if (stdin.isTTY) {
        stdin.setRawMode(false)
      }
      stdout.write("\n")
    }

    const onKeyPress = (_, key) => {
      if (!key) {
        return
      }

      if (key.ctrl && key.name === "c") {
        cleanup()
        rejectPromise(new Error("Operation cancelled"))
        return
      }

      if (key.name === "up") {
        selectedIndex = selectedIndex === 0 ? options.length - 1 : selectedIndex - 1
        render()
        return
      }

      if (key.name === "down") {
        selectedIndex = selectedIndex === options.length - 1 ? 0 : selectedIndex + 1
        render()
        return
      }

      if (key.name === "space") {
        const id = options[selectedIndex].id
        if (selected.has(id)) {
          selected.delete(id)
        } else {
          selected.add(id)
        }
        render()
        return
      }

      if (key.name === "a") {
        if (selected.size === options.length) {
          selected = new Set()
        } else {
          selected = new Set(options.map((option) => option.id))
        }
        render()
        return
      }

      if (key.name === "return") {
        cleanup()
        resolvePromise([...selected])
      }
    }

    emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.on("keypress", onKeyPress)
    render()
  })
}

function getBaseSkillFrontmatter() {
  return `---
name: cascadetui
description: Build and maintain terminal UIs with CascadeTUI. Use when creating components, layouts, renderables, keyboard interactions, and debugging terminal UI behavior in Cascade-based projects.
compatibility: Requires Bun and TypeScript. Designed for agents that support Agent Skills and SKILL.md frontmatter.
metadata:
  author: cascadetui
  version: "1.0"
---`
}

function getBaseSkillBody() {
  return `# CascadeTUI Skill

## When To Use
- Use this skill when the user is building or debugging a terminal UI with CascadeTUI.
- Use this skill for component layout, rendering behavior, keyboard handling, and interaction logic.
- Use this skill for scaffold and setup guidance in Cascade projects.

## Instructions
1. Prefer Bun commands and APIs.
2. Prefer \`@cascadetui/core\` for low-level renderables unless the user explicitly asks for React or Solid.
3. Use \`@cascadetui/react\` or \`@cascadetui/solid\` only when requested.
4. Keep code minimal, typed, deterministic, and production-ready.
5. Reproduce rendering bugs with a minimal reproducible test case before applying fixes.
6. Validate keyboard, focus, and resize behavior for interactive components.

## Scaffolding
- \`bun create cascade my-app\`
- \`cd my-app\`
- \`bun install\`
- \`bun run dev\`

## Notes
- Favor clear state transitions and predictable rendering.
- Avoid adding dependencies that duplicate Bun runtime capabilities.
`
}

function getClaudeAppendix() {
  return `## Documentation Index
Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
Use this file to discover all available pages before exploring further.

## Claude Code Skill Notes
- Keep this skill in a global location: \`~/.claude/skills/cascadetui/SKILL.md\`.
- Skills can be auto-invoked by Claude when relevant, or manually via \`/cascadetui\`.
- Keep the skill content concise and place optional supporting files beside \`SKILL.md\` when needed.
`
}

function getCursorFrontmatter() {
  return `---
name: cascadetui
description: Build and maintain terminal UIs with CascadeTUI. Use when creating components, layouts, renderables, keyboard interactions, and debugging terminal UI behavior in Cascade-based projects.
compatibility: Cursor Agent Skills format with global installation under ~/.cursor/skills.
metadata:
  author: cascadetui
  version: "1.0"
---`
}

function getCursorAppendix() {
  return `## Cursor Skill Notes
- Use global installation first: \`~/.cursor/skills/cascadetui/SKILL.md\`.
- This skill follows the Agent Skills standard with YAML frontmatter.
- Ask clarification questions when requirements are ambiguous.
- Keep supporting material in \`references/\`, \`scripts/\`, and \`assets/\` only if needed.
`
}

function getSkillContent(agent) {
  if (agent.flavor === "claude") {
    return `${getBaseSkillFrontmatter()}

${getBaseSkillBody()}

${getClaudeAppendix()}
`
  }

  if (agent.flavor === "cursor") {
    return `${getCursorFrontmatter()}

${getBaseSkillBody()}

${getCursorAppendix()}
`
  }

  return `${getBaseSkillFrontmatter()}

${getBaseSkillBody()}
`
}

function installSkill(agent, dryRun) {
  const content = getSkillContent(agent)
  const targetFile = agent.installPath
  const targetDir = resolve(targetFile, "..")

  if (dryRun) {
    return { agent: agent.id, path: targetFile, written: false }
  }

  mkdirSync(targetDir, { recursive: true })
  writeFileSync(targetFile, content)
  return { agent: agent.id, path: targetFile, written: true }
}

async function resolveAgentsToInstall(rl, detectedAgents, options) {
  if (options.agents.length > 0) {
    validateAgentIds(options.agents, detectedAgents)
    return options.agents
  }

  const detectedIds = detectedAgents.filter((agent) => agent.detected).map((agent) => agent.id)
  if (options.allDetected) {
    return detectedIds
  }

  if (!process.stdin.isTTY) {
    return detectedIds
  }

  const selectable = toSelectableOptions(detectedAgents)
  const preselected = detectedIds.length > 0 ? detectedIds : detectedAgents.slice(0, 1).map((agent) => agent.id)

  console.log("")
  if (detectedIds.length > 0) {
    console.log(`Detected agents: ${detectedIds.join(", ")}`)
    console.log(`Quick install command: npx create-cascade-skill --agents ${detectedIds.join(",")}`)
  } else {
    console.log("No agent was auto-detected. Select manually.")
  }

  const selected = await selectMany(rl, "Choose agent targets for CascadeTUI skill:", selectable, preselected)
  if (selected.length > 0) {
    return selected
  }

  const fallback = (await promptLine(rl, "No agent selected. Enter comma-separated IDs (or leave empty to cancel): ")).trim()
  if (!fallback) {
    return []
  }

  const parsed = unique(parseAgentsArg(fallback))
  validateAgentIds(parsed, detectedAgents)
  return parsed
}

async function main() {
  const options = parseArgs(process.argv)
  if (options.help) {
    printHelp()
    return
  }

  const agents = detectAgents(getAgents())
  if (options.list) {
    printList(agents)
    return
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const selectedIds = await resolveAgentsToInstall(rl, agents, options)
    if (selectedIds.length === 0) {
      console.log("Nothing to install.")
      return
    }

    const selectedAgents = agents.filter((agent) => selectedIds.includes(agent.id))
    const results = selectedAgents.map((agent) => installSkill(agent, options.dryRun))

    console.log("")
    console.log(`${ANSI_BOLD}CascadeTUI skill installer${ANSI_RESET}`)
    for (const result of results) {
      const prefix = result.written ? `${ANSI_GREEN}installed${ANSI_RESET}` : `${ANSI_YELLOW}planned${ANSI_RESET}`
      console.log(`- ${result.agent}: ${prefix} -> ${result.path}`)
    }

    if (options.dryRun) {
      console.log("")
      console.log("Dry run complete. Re-run without --dry-run to write files.")
    }
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
