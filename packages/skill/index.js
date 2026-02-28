#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";

const ANSI_RESET = "\x1b[0m";
const ANSI_BOLD = "\x1b[1m";
const ANSI_DIM = "\x1b[2m";
const ANSI_CYAN = "\x1b[36m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_YELLOW = "\x1b[33m";

function getHomeDirectory(options) {
  if (options?.home) {
    return options.home;
  }
  return (
    process.env.CASCADE_SKILL_HOME ||
    process.env.HOME ||
    process.env.USERPROFILE ||
    process.cwd()
  );
}

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookup, [command], { stdio: "ignore" });
  return result.status === 0;
}

function parseAgentsArg(value) {
  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
}

function unique(items) {
  return [...new Set(items)];
}

function getAgents(options) {
  const home = getHomeDirectory(options);
  const appData =
    options?.appData ||
    process.env.CASCADE_SKILL_APPDATA ||
    process.env.APPDATA ||
    join(home, "AppData", "Roaming");
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
      id: "factory",
      label: "Factory (Droid CLI)",
      description: "Install in ~/.factory/skills/cascadetui/SKILL.md",
      commands: ["droid"],
      detectPaths: [join(home, ".factory")],
      installPath: join(home, ".factory", "skills", "cascadetui", "SKILL.md"),
      flavor: "factory",
    },
    {
      id: "windsurf",
      label: "Windsurf",
      description: "Install in ~/.codeium/windsurf/skills/cascadetui/SKILL.md",
      commands: ["windsurf"],
      detectPaths: [join(home, ".codeium"), join(appData, "Codeium")],
      installPath: join(
        home,
        ".codeium",
        "windsurf",
        "skills",
        "cascadetui",
        "SKILL.md"
      ),
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
      installPath: join(
        home,
        ".config",
        "goose",
        "skills",
        "cascadetui",
        "SKILL.md"
      ),
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
  ];
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    agents: [],
    allDetected: false,
    list: false,
    dryRun: false,
    force: false,
    help: false,
    home: undefined,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--agents" || arg === "-a") {
      options.agents.push(...parseAgentsArg(args[i + 1] || ""));
      i += 1;
      continue;
    }
    if (arg.startsWith("--agents=")) {
      options.agents.push(...parseAgentsArg(arg.slice("--agents=".length)));
      continue;
    }
    if (arg === "--all-detected") {
      options.allDetected = true;
      continue;
    }
    if (arg === "--list") {
      options.list = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--home") {
      options.home = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--home=")) {
      options.home = arg.slice("--home=".length);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  options.agents = unique(options.agents);
  return options;
}

function printHelp() {
  console.log("Usage: npx create-cascade-skill [options]");
  console.log("");
  console.log("Options:");
  console.log("  -a, --agents <ids>    Comma-separated agent IDs to install");
  console.log("  --all-detected        Install for all detected agents");
  console.log("  --list                Print supported and detected agents");
  console.log("  --dry-run             Preview files without writing");
  console.log("  --force               Overwrite SKILL.md when it differs");
  console.log("  --home <path>          Override home directory used for detection/install");
  console.log("  -h, --help            Show help");
  console.log("");
  console.log("Examples:");
  console.log("  npx create-cascade-skill");
  console.log("  npx create-cascade-skill --all-detected");
  console.log("  npx create-cascade-skill --agents codex,cursor,cline");
  console.log("  npx create-cascade-skill --agents codex --dry-run");
  console.log("  npx create-cascade-skill --agents windsurf --home ./sandbox --dry-run");
}

function detectAgents(agents) {
  return agents.map((agent) => {
    const commandHit = agent.commands.some((command) => commandExists(command));
    const pathHit = agent.detectPaths.some((path) => existsSync(path));
    return { ...agent, detected: commandHit || pathHit };
  });
}

function printList(agents) {
  console.log(`${ANSI_BOLD}Supported agents${ANSI_RESET}`);
  for (const agent of agents) {
    const marker = agent.detected
      ? `${ANSI_GREEN}detected${ANSI_RESET}`
      : `${ANSI_YELLOW}not detected${ANSI_RESET}`;
    console.log(`- ${agent.id.padEnd(12)} ${marker}  ${agent.label}`);
  }
  const detected = agents
    .filter((agent) => agent.detected)
    .map((agent) => agent.id);
  console.log("");
  if (detected.length > 0) {
    console.log(`Detected IDs: ${detected.join(", ")}`);
    console.log(
      `Install all detected: npx create-cascade-skill --agents ${detected.join(
        ","
      )}`
    );
  } else {
    console.log("Detected IDs: none");
  }
}

function validateAgentIds(selected, agents) {
  const allowed = new Set(agents.map((agent) => agent.id));
  for (const id of selected) {
    if (!allowed.has(id)) {
      throw new Error(`Unknown agent id: ${id}`);
    }
  }
}

function promptLine(rl, label) {
  return rl.question(label);
}

function toSelectableOptions(agents) {
  return agents.map((agent) => ({
    id: agent.id,
    label: agent.label,
    description: `${agent.description}${agent.detected ? " [detected]" : ""}`,
  }));
}

async function selectMany(rl, label, options, preselectedIds) {
  if (!process.stdin.isTTY) {
    return preselectedIds;
  }
  const stdin = process.stdin;
  const stdout = process.stdout;
  let selectedIndex = 0;
  let selected = new Set(preselectedIds);
  const totalLines = options.length + 3;
  let renderedOnce = false;
  const render = () => {
    if (renderedOnce) {
      stdout.write(`\x1b[${totalLines}F`);
    } else {
      stdout.write("\n");
    }
    stdout.write(`${ANSI_BOLD}${label}${ANSI_RESET}\n`);
    for (let i = 0; i < options.length; i += 1) {
      const option = options[i];
      const isCursor = i === selectedIndex;
      const isSelected = selected.has(option.id);
      const cursor = isCursor
        ? `${ANSI_BOLD}${ANSI_CYAN}>${ANSI_RESET}`
        : " ";
      const mark = isSelected ? `${ANSI_GREEN}[x]${ANSI_RESET}` : "[ ]";
      const styleStart = isCursor ? `${ANSI_BOLD}${ANSI_CYAN}` : "";
      const styleEnd = isCursor ? ANSI_RESET : "";
      stdout.write(
        `${cursor} ${mark} ${styleStart}${option.label}${styleEnd} ${ANSI_DIM}(${option.id}) - ${option.description}${ANSI_RESET}\n`
      );
    }
    stdout.write(
      `${ANSI_DIM}Use Up/Down, Space to toggle, A to toggle all, Enter to confirm${ANSI_RESET}\n`
    );
    renderedOnce = true;
  };
  return new Promise((resolvePromise, rejectPromise) => {
    const cleanup = () => {
      stdin.off("keypress", onKeyPress);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
      stdout.write("\n");
    };
    const onKeyPress = (_, key) => {
      if (!key) {
        return;
      }
      if (key.ctrl && key.name === "c") {
        cleanup();
        rejectPromise(new Error("Operation cancelled"));
        return;
      }
      if (key.name === "up") {
        selectedIndex =
          selectedIndex === 0 ? options.length - 1 : selectedIndex - 1;
        render();
        return;
      }
      if (key.name === "down") {
        selectedIndex =
          selectedIndex === options.length - 1 ? 0 : selectedIndex + 1;
        render();
        return;
      }
      if (key.name === "space") {
        const id = options[selectedIndex].id;
        if (selected.has(id)) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
        render();
        return;
      }
      if (key.name === "a") {
        if (selected.size === options.length) {
          selected = new Set();
        } else {
          selected = new Set(options.map((option) => option.id));
        }
        render();
        return;
      }
      if (key.name === "return") {
        cleanup();
        resolvePromise([...selected]);
      }
    };
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("keypress", onKeyPress);
    render();
  });
}

function getSkillFrontmatter(agent) {
  const baseName = "cascadetui";
  const description =
    "Build terminal user interfaces with CascadeTUI. Use this skill to scaffold, debug, and refactor Cascade-based TUIs (layout, input, rendering, keyboard navigation, React/Solid bindings). Triggers: Cascade, CascadeTUI, TUI, terminal UI, keybindings, focus, renderer.";
  let compatibility = "Requires Bun and TypeScript.";
  if (agent.flavor === "claude") {
    compatibility += " Designed for Claude Code.";
  } else if (agent.flavor === "cursor") {
    compatibility += " Designed for Cursor.";
  } else if (agent.flavor === "codex") {
    compatibility += " Designed for OpenAI Codex.";
  } else if (agent.flavor === "factory") {
    compatibility += " Designed for Factory (Droid CLI).";
  } else {
    compatibility += ` Designed for ${agent.label}.`;
  }

  const allowedTools =
    agent.flavor === "factory"
      ? "Read, Bash, Write"
      : "Bash(bun:*) Bash(npm:*) Bash(node:*)";

  const extraFactoryFrontmatter =
    agent.flavor === "factory"
      ? `\nuser-invocable: true\ndisable-model-invocation: false`
      : "";

  return (
    `---\n` +
    `name: ${baseName}\n` +
    `description: ${description}\n` +
    `compatibility: ${compatibility}\n` +
    `allowed-tools: ${allowedTools}` +
    `${extraFactoryFrontmatter}\n` +
    `metadata:\n` +
    `  author: cascadetui\n` +
    `  version: "1.2"\n` +
    `---`
  );
}

function getSkillBody() {
  return `# CascadeTUI Engineering Skill

## Use This When

Activate for tasks involving:
- Building a new terminal UI (TUI) with CascadeTUI
- Fixing layout, rendering glitches, or resize bugs
- Keyboard navigation, focus, selection, shortcuts, input handling
- React/Solid bindings on top of CascadeTUI core
- Performance issues (re-render storms, slow lists) or state determinism

## Output Expectations

When implementing or refactoring, produce:
- A minimal, runnable entrypoint that demonstrates the behavior
- Deterministic state updates and predictable render cycles
- Clear keybindings and focus behavior
- A short verification checklist (commands + manual steps)

## Project Workflow (Bun-first)

1) Ensure dependencies
\`\`\`bash
bun install
\`\`\`

2) Run the app (or a repro script)
\`\`\`bash
bun run dev
\`\`\`

3) Add a tiny repro when debugging
- Create \`scripts/repro.ts\` or a minimal app entrypoint
- Keep it self-contained: one screen, one interaction, one bug

## Design Rules (CascadeTUI-specific)

### Deterministic UI
- Treat rendering as a pure function of state
- Avoid hidden mutable globals for UI state
- Prefer single source of truth (one store or a small set of state atoms)

### Layout & Composition
- Compose screens with containers and consistent spacing
- Keep one responsibility per component: layout vs input vs domain logic
- Use stable keys for lists; avoid index keys if items can move

### Input, Focus, and Navigation
- Define a keymap per screen (Up/Down, Enter, Esc, Tab, Ctrl shortcuts)
- Always document primary actions and an escape/back path
- Ensure focus is explicit: which element receives keys right now
- Handle terminal resize: reflow layout and keep selection stable

### Rendering & Performance
- Avoid rebuilding large trees on every keypress
- For large lists: paginate, virtualize, or reduce per-row computation
- Batch state updates; avoid cascading updates during render

## Debugging Playbook

When something is wrong:
1) Confirm the bug in a tiny repro
2) Log state transitions around the interaction
3) Verify input events fire once (no duplicated handlers)
4) Verify keys/ids are stable (especially lists)
5) Verify resize behavior by changing terminal size rapidly

Common failure modes:
- Duplicate listeners attached on re-render
- Non-stable list keys causing selection jumps
- Async state updates racing; UI shows stale selection
- Layout constraints (width/height) not propagated as expected

## Quick Recipes

### Add a consistent keymap footer
- Show the active shortcuts at the bottom (e.g. \`q\` quit, \`/\` search, arrows navigate)
- Keep it updated per screen

### Search + List pattern
- Input line at top
- Filtered list in the middle
- Details/preview panel (optional)
- Enter selects, Esc clears/back

### React binding guidance
- Keep bridge components thin
- Avoid passing unstable props that trigger full-tree rerenders
- Prefer memoization at boundaries (list row, heavy panels)

## Verification Checklist

Run:
\`\`\`bash
bun run typecheck
bun run lint
bun test
\`\`\`

Manual:
- Start app in small and large terminals
- Resize while a list item is selected
- Navigate with keyboard only
- Confirm exit behavior (Ctrl+C and explicit quit key)
`;
}

function getImprovedClaudeAppendix() {
  return `## Documentation Index

Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt. Use this file to discover all available pages before exploring further.

## Claude Code Skill Notes

- Place this skill in a global location: \`~/.claude/skills/cascadetui/SKILL.md\`. Do not nest additional directories deeper than one level.
- Claude automatically loads skills whose \`name\` and \`description\` fields match the user's request; keep them descriptive and concise.
- Follow the naming conventions from the Agent Skills specification: lowercase alphanumeric and hyphens only, no reserved words (anthropic, claude).
- Use progressive disclosure: keep \`SKILL.md\` under 500 lines and move lengthy instructions to \`references/\` files.
- Ask clarifying questions when requirements are ambiguous or when multiple interpretations exist.
- Keep scripts deterministic and self-contained; avoid side effects that require external network access unless absolutely necessary.
`;
}

function getImprovedCursorAppendix() {
  return `## Cursor Skill Notes

- Install this skill globally under \`~/.cursor/skills/cascadetui/SKILL.md\`.
- Cursor uses the open Agent Skills format with YAML frontmatter; ensure the \`name\` and \`description\` fields align with your directory name and skill triggers.
- Ask clarifying questions when user requests lack details.
- Keep supporting materials in \`references/\`, \`scripts/\`, and \`assets/\` for progressive disclosure.
- Avoid referencing frameworks (React, Solid) unless specifically requested by the user.
- Use determinism and idempotent commands; Cursor may re-run instructions if the output is ambiguous.
`;
}

function getImprovedFactoryAppendix() {
  return `## Factory (Droid CLI) Skill Notes

- Skills are discovered from:
  - Workspace: \`<repo>/.factory/skills/<skill-name>/SKILL.md\`
  - Personal: \`~/.factory/skills/<skill-name>/SKILL.md\`
  - Compatibility: \`<repo>/.agent/skills/\` :contentReference[oaicite:1]{index=1}
- This installer writes to the personal location by default: \`~/.factory/skills/cascadetui/SKILL.md\`.
- If you want to share the skill with teammates, copy it into your repo under \`.factory/skills/cascadetui/SKILL.md\` and commit it. :contentReference[oaicite:2]{index=2}
- Invocation control:
  - \`disable-model-invocation: true\` to require manual \`/cascadetui\` invocation
  - \`user-invocable: false\` to hide it from slash commands and keep it model-only :contentReference[oaicite:3]{index=3}
- Restart \`droid\` after adding/updating skills so it rescans them. :contentReference[oaicite:4]{index=4}
`;
}

function getGenericAppendix(agent) {
  return `## ${agent.label} Skill Notes

- Install this skill globally under the agent's skills directory (for example, \`${agent.installPath}\`).
- This agent supports the open Agent Skills format; ensure the \`name\` and \`description\` fields match the directory name and capture when to trigger this skill.
- Use progressive disclosure: place detailed guides, examples, or scripts in \`references/\` and \`scripts/\` directories to minimise the size of \`SKILL.md\`.
- Ask for clarification when the user's request is ambiguous.
- Follow the principles outlined in this skill for minimal, typed, and deterministic code.`;
}

function getSkillContent(agent) {
  const frontmatter = getSkillFrontmatter(agent);
  const body = getSkillBody();
  if (agent.flavor === "claude") {
    return frontmatter + "\n\n" + body + "\n\n" + getImprovedClaudeAppendix();
  }
  if (agent.flavor === "cursor") {
    return frontmatter + "\n\n" + body + "\n\n" + getImprovedCursorAppendix();
  }
  if (agent.flavor === "factory") {
    return frontmatter + "\n\n" + body + "\n\n" + getImprovedFactoryAppendix();
  }
  return frontmatter + "\n\n" + body + "\n\n" + getGenericAppendix(agent);
}

function installSkill(agent, options) {
  const content = getSkillContent(agent);
  const targetFile = agent.installPath;
  const targetDir = resolve(targetFile, "..");
  if (options.dryRun) {
    return { agent: agent.id, path: targetFile, written: false, skipped: false, reason: "dry-run" };
  }
  if (existsSync(targetFile)) {
    try {
      const existing = readFileSync(targetFile, "utf8");
      if (existing === content) {
        return {
          agent: agent.id,
          path: targetFile,
          written: false,
          skipped: true,
          reason: "already up-to-date",
        };
      }
      if (!options.force) {
        return {
          agent: agent.id,
          path: targetFile,
          written: false,
          skipped: true,
          reason: "exists (use --force to overwrite)",
        };
      }
    } catch {
      if (!options.force) {
        return {
          agent: agent.id,
          path: targetFile,
          written: false,
          skipped: true,
          reason: "exists (unreadable; use --force to overwrite)",
        };
      }
    }
  }
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(targetFile, content);
  return { agent: agent.id, path: targetFile, written: true, skipped: false, reason: "written" };
}

async function resolveAgentsToInstall(rl, detectedAgents, options) {
  if (options.agents.length > 0) {
    validateAgentIds(options.agents, detectedAgents);
    return options.agents;
  }
  const detectedIds = detectedAgents
    .filter((agent) => agent.detected)
    .map((agent) => agent.id);
  if (options.allDetected) {
    return detectedIds;
  }
  if (!process.stdin.isTTY) {
    return detectedIds;
  }
  const selectable = toSelectableOptions(detectedAgents);
  const preselected =
    detectedIds.length > 0
      ? detectedIds
      : detectedAgents.slice(0, 1).map((agent) => agent.id);
  console.log("");
  if (detectedIds.length > 0) {
    console.log(`Detected agents: ${detectedIds.join(", ")}`);
    console.log(
      `Quick install command: npx create-cascade-skill --agents ${detectedIds.join(
        ","
      )}`
    );
  } else {
    console.log("No agent was auto-detected. Select manually.");
  }
  const selected = await selectMany(
    rl,
    "Choose agent targets for CascadeTUI skill:",
    selectable,
    preselected
  );
  if (selected.length > 0) {
    return selected;
  }
  const fallback = (
    await promptLine(
      rl,
      "No agent selected. Enter comma-separated IDs (or leave empty to cancel): "
    )
  ).trim();
  if (!fallback) {
    return [];
  }
  const parsed = unique(parseAgentsArg(fallback));
  validateAgentIds(parsed, detectedAgents);
  return parsed;
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }
  const agents = detectAgents(getAgents({ home: options.home }));
  if (options.list) {
    printList(agents);
    return;
  }
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const selectedIds = await resolveAgentsToInstall(rl, agents, options);
    if (selectedIds.length === 0) {
      console.log("Nothing to install.");
      return;
    }
    const selectedAgents = agents.filter((agent) => selectedIds.includes(agent.id));
    const results = selectedAgents.map((agent) => installSkill(agent, options));
    console.log("");
    console.log(`${ANSI_BOLD}CascadeTUI skill installer${ANSI_RESET}`);
    for (const result of results) {
      const prefix = result.written
        ? `${ANSI_GREEN}installed${ANSI_RESET}`
        : result.skipped
          ? `${ANSI_YELLOW}skipped${ANSI_RESET}`
          : `${ANSI_YELLOW}planned${ANSI_RESET}`;
      const suffix = result.reason ? ` (${result.reason})` : "";
      console.log(`- ${result.agent}: ${prefix} -> ${result.path}${suffix}`);
    }
    if (options.dryRun) {
      console.log("");
      console.log("Dry run complete. Re-run without --dry-run to write files.");
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});