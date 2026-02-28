#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"
import { createInterface } from "node:readline/promises"
import { emitKeypressEvents } from "node:readline"

const ANSI_RESET = "\x1b[0m"
const ANSI_BOLD = "\x1b[1m"
const ANSI_DIM = "\x1b[2m"
const ANSI_CYAN = "\x1b[36m"

const FRAMEWORKS = [
  { id: "core", label: "Core", description: "Vanilla Cascade API with renderables" },
  { id: "react", label: "React", description: "Cascade renderer with React components" },
  { id: "solid", label: "Solid", description: "Cascade renderer with SolidJS components" },
]

const STARTERS = {
  core: [
    { id: "minimal", label: "Minimal", description: "Welcome panel with quick next steps" },
    { id: "counter", label: "Counter", description: "Live counter updated every second" },
    { id: "layout", label: "Layout", description: "Simple boxed layout starter" },
  ],
  react: [
    { id: "minimal", label: "Minimal", description: "Welcome panel with quick next steps" },
    { id: "counter", label: "Counter", description: "React state with interval updates" },
    { id: "login", label: "Login", description: "Small interactive login form" },
  ],
  solid: [
    { id: "minimal", label: "Minimal", description: "Welcome panel with quick next steps" },
    { id: "counter", label: "Counter", description: "Solid signal with interval updates" },
    { id: "input", label: "Input", description: "Basic input and submit interaction" },
  ],
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const options = {
    install: false,
    start: false,
    here: false,
    framework: undefined,
    starter: undefined,
    help: false,
  }
  const positionals = []

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]

    if (arg === "--install") {
      options.install = true
      continue
    }
    if (arg === "--start") {
      options.start = true
      options.install = true
      continue
    }
    if (arg === "--no-install") {
      options.install = false
      continue
    }
    if (arg === "--no-start") {
      options.start = false
      continue
    }
    if (arg === "--here") {
      options.here = true
      continue
    }
    if (arg === "--framework" || arg === "-f" || arg === "--template" || arg === "-t") {
      options.framework = args[i + 1]
      i += 1
      continue
    }
    if (arg === "--starter" || arg === "-s") {
      options.starter = args[i + 1]
      i += 1
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
  console.log("Usage: bun create cascade [project-name] [options]")
  console.log("")
  console.log("Options:")
  console.log("  -f, --framework <name>  Framework: core, react, solid")
  console.log("  -s, --starter <name>    Starter preset for selected framework")
  console.log("  --here                  Use current directory")
  console.log("  --install               Run bun install after scaffolding")
  console.log("  --start                 Run bun install, then bun run dev")
  console.log("  -h, --help              Show help")
  console.log("")
  console.log("Examples:")
  console.log("  bun create cascade")
  console.log("  bun create cascade my-app")
  console.log("  bun create cascade --here")
  console.log("  bun create cascade my-app -f react -s counter")
}

function normalizePackageName(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cascade-app"
  )
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

function promptLine(rl, label) {
  return rl.question(label)
}

async function selectOption(rl, label, options) {
  if (!process.stdin.isTTY) {
    return options[0].id
  }

  const stdin = process.stdin
  const stdout = process.stdout
  let selectedIndex = 0
  const totalLines = options.length + 2
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
      const isSelected = i === selectedIndex
      const prefix = isSelected ? `${ANSI_BOLD}${ANSI_CYAN}>${ANSI_RESET}` : " "
      const styleStart = isSelected ? `${ANSI_BOLD}${ANSI_CYAN}` : ""
      const styleEnd = isSelected ? ANSI_RESET : ""
      stdout.write(
        `${prefix} ${styleStart}${option.label}${styleEnd} ${ANSI_DIM}(${option.id}) - ${option.description}${ANSI_RESET}\n`
      )
    }

    stdout.write(`${ANSI_DIM}Use Up/Down arrows and Enter${ANSI_RESET}\n`)
    renderedOnce = true
  }

  return new Promise((resolve, reject) => {
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
        reject(new Error("Operation cancelled"))
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

      if (key.name === "return") {
        const selected = options[selectedIndex]
        cleanup()
        resolve(selected.id)
      }
    }

    emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.on("keypress", onKeyPress)
    render()
  })
}

async function resolveFramework(rl, frameworkArg) {
  if (frameworkArg) {
    const found = FRAMEWORKS.find((entry) => entry.id === frameworkArg)
    if (!found) {
      throw new Error(`Unknown framework: ${frameworkArg}. Use core, react, or solid.`)
    }
    return found.id
  }

  if (!process.stdin.isTTY) {
    return "core"
  }

  return selectOption(rl, "Choose a framework:", FRAMEWORKS)
}

async function resolveStarter(rl, framework, starterArg) {
  const choices = STARTERS[framework]

  if (starterArg) {
    const found = choices.find((entry) => entry.id === starterArg)
    if (!found) {
      const allowed = choices.map((entry) => entry.id).join(", ")
      throw new Error(`Unknown starter '${starterArg}' for ${framework}. Allowed: ${allowed}.`)
    }
    return found.id
  }

  if (!process.stdin.isTTY) {
    return choices[0].id
  }

  return selectOption(rl, `Choose a starter for ${framework}:`, choices)
}

async function resolveLocation(rl, options, positionals) {
  if (options.here) {
    return "here"
  }

  if (positionals[0]) {
    return "new"
  }

  if (!process.stdin.isTTY) {
    return "new"
  }

  return selectOption(rl, "Where should the project be created?", [
    { id: "new", label: "New folder", description: "Create and use a new project directory" },
    { id: "here", label: "Current folder", description: "Use the current directory directly" },
  ])
}

async function resolveProjectName(rl, positionals, defaultName = "cascade-app") {
  if (positionals[0]) {
    return positionals[0]
  }

  if (!process.stdin.isTTY) {
    return defaultName
  }

  const input = (await promptLine(rl, `Project name (default: ${defaultName}): `)).trim()
  return input || defaultName
}

function shouldRunInteractiveWizard(options, positionals) {
  if (!process.stdin.isTTY) {
    return false
  }

  return !positionals[0] && !options.here && !options.framework && !options.starter
}

function getPackageJson(projectName, framework) {
  const dependencies = {
    "@cascadetui/core": "latest",
  }

  if (framework === "react") {
    dependencies["@cascadetui/react"] = "latest"
    dependencies.react = "latest"
  }

  if (framework === "solid") {
    dependencies["@cascadetui/solid"] = "latest"
    dependencies["solid-js"] = "latest"
  }

  const isJsx = framework !== "core"
  const entry = isJsx ? "src/index.tsx" : "src/index.ts"

  return {
    name: normalizePackageName(projectName),
    version: "0.0.1",
    private: true,
    type: "module",
    scripts: {
      dev: `bun run ${entry}`,
      start: `bun run ${entry}`,
      typecheck: "bunx tsc --noEmit",
    },
    dependencies,
  }
}

function getTsConfig(framework) {
  const base = {
    target: "ESNext",
    module: "ESNext",
    moduleResolution: "Bundler",
    strict: true,
    noEmit: true,
    verbatimModuleSyntax: true,
    skipLibCheck: true,
    types: ["bun-types"],
  }

  if (framework === "react") {
    return {
      compilerOptions: {
        ...base,
        lib: ["ESNext", "DOM"],
        jsx: "react-jsx",
        jsxImportSource: "@cascadetui/react",
      },
      include: ["src"],
    }
  }

  if (framework === "solid") {
    return {
      compilerOptions: {
        ...base,
        jsx: "preserve",
        jsxImportSource: "@cascadetui/solid",
      },
      include: ["src"],
    }
  }

  return {
    compilerOptions: base,
    include: ["src"],
  }
}

function getSource(framework, starter) {
  const sources = {
    core: {
      minimal: `import { BoxRenderable, TextRenderable, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer({ exitOnCtrlC: true })

const root = new BoxRenderable(renderer, {
  width: "100%",
  height: "100%",
  padding: 1,
  flexDirection: "column",
})

const card = new BoxRenderable(renderer, {
  border: true,
  borderStyle: "single",
  padding: 1,
  width: 72,
  height: 16,
  flexDirection: "column",
})

const header = new BoxRenderable(renderer, {
  flexDirection: "column",
  marginBottom: 1,
})

const title = new TextRenderable(renderer, {
  content: "Cascade Core",
  fg: "#00ff99",
})

const subtitle = new TextRenderable(renderer, {
  content: "A tiny terminal UI runtime with clean layout primitives.",
  fg: "#cbd5e1",
  marginTop: 1,
})

header.add(title)
header.add(subtitle)

const steps = new BoxRenderable(renderer, {
  flexDirection: "column",
  marginTop: 1,
})

const s1 = new TextRenderable(renderer, { content: "1) Edit src/index.ts", fg: "#e2e8f0" })
const s2 = new TextRenderable(renderer, { content: "2) bun run dev", fg: "#e2e8f0", marginTop: 1 })
const s3 = new TextRenderable(renderer, { content: "3) Compose renderables into screens", fg: "#e2e8f0", marginTop: 1 })

steps.add(s1)
steps.add(s2)
steps.add(s3)

const footer = new BoxRenderable(renderer, {
  marginTop: 2,
  border: true,
  borderStyle: "single",
  padding: 1,
  flexDirection: "column",
})

const keys = new TextRenderable(renderer, {
  content: "Keys: Ctrl+C quit",
  fg: "#94a3b8",
})

const hint = new TextRenderable(renderer, {
  content: "Tip: Keep rendering deterministic. Let state drive UI updates.",
  fg: "#94a3b8",
  marginTop: 1,
})

footer.add(keys)
footer.add(hint)

card.add(header)
card.add(steps)
card.add(footer)

root.add(card)
renderer.root.add(root)
`,
      counter: `import { BoxRenderable, TextRenderable, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer({ exitOnCtrlC: true })
let count = 0

const root = new BoxRenderable(renderer, {
  width: "100%",
  height: "100%",
  padding: 1,
  flexDirection: "column",
})

const card = new BoxRenderable(renderer, {
  border: true,
  borderStyle: "single",
  padding: 1,
  width: 60,
  height: 10,
  flexDirection: "column",
})

const title = new TextRenderable(renderer, {
  content: "Core Counter",
  fg: "#00ff99",
})

const value = new TextRenderable(renderer, {
  content: "Count: 0",
  fg: "#e2e8f0",
  marginTop: 1,
})

const meta = new TextRenderable(renderer, {
  content: "Updates every second. Ctrl+C to exit.",
  fg: "#94a3b8",
  marginTop: 1,
})

card.add(title)
card.add(value)
card.add(meta)

root.add(card)
renderer.root.add(root)

setInterval(() => {
  count += 1
  value.content = \`Count: \${count}\`
}, 1000)
`,
      layout: `import { BoxRenderable, TextRenderable, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer({ exitOnCtrlC: true })

const root = new BoxRenderable(renderer, {
  width: "100%",
  height: "100%",
  padding: 1,
  flexDirection: "row",
  gap: 2,
})

const sidebar = new BoxRenderable(renderer, {
  border: true,
  borderStyle: "single",
  padding: 1,
  width: 26,
  height: 18,
  flexDirection: "column",
})

const sideTitle = new TextRenderable(renderer, {
  content: "Navigation",
  fg: "#00ff99",
})

const nav1 = new TextRenderable(renderer, { content: "• Overview", fg: "#e2e8f0", marginTop: 1 })
const nav2 = new TextRenderable(renderer, { content: "• Components", fg: "#e2e8f0", marginTop: 1 })
const nav3 = new TextRenderable(renderer, { content: "• Input & Focus", fg: "#e2e8f0", marginTop: 1 })
const nav4 = new TextRenderable(renderer, { content: "• Performance", fg: "#e2e8f0", marginTop: 1 })

sidebar.add(sideTitle)
sidebar.add(nav1)
sidebar.add(nav2)
sidebar.add(nav3)
sidebar.add(nav4)

const main = new BoxRenderable(renderer, {
  border: true,
  borderStyle: "single",
  padding: 1,
  width: 74,
  height: 18,
  flexDirection: "column",
})

const mainTitle = new TextRenderable(renderer, {
  content: "Layout Starter",
  fg: "#00ff99",
})

const mainBody = new TextRenderable(renderer, {
  content: "Compose a screen with a sidebar + content panel. Add your own state and update text/content deterministically.",
  fg: "#cbd5e1",
  marginTop: 1,
})

const mainFooter = new BoxRenderable(renderer, {
  border: true,
  borderStyle: "single",
  padding: 1,
  marginTop: 2,
  flexDirection: "column",
})

const footerText = new TextRenderable(renderer, {
  content: "Keys: Ctrl+C quit",
  fg: "#94a3b8",
})

mainFooter.add(footerText)

main.add(mainTitle)
main.add(mainBody)
main.add(mainFooter)

root.add(sidebar)
root.add(main)
renderer.root.add(root)
`,
    },
    react: {
      minimal: `import { createCliRenderer } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"

function App() {
  return (
    <box style={{ width: "100%", height: "100%", padding: 1, flexDirection: "column", alignItems: "flex-start" }}>
      <box style={{ border: true, borderStyle: "single", padding: 1, width: 72, height: 16, flexDirection: "column" }}>
        <text content="Cascade React" fg="#00ff99" />
        <text content="Build interactive terminal UIs with components and hooks." fg="#cbd5e1" marginTop={1} />
        <box style={{ flexDirection: "column", marginTop: 2 }}>
          <text content="1) Edit src/index.tsx" fg="#e2e8f0" />
          <text content="2) bun run dev" fg="#e2e8f0" marginTop={1} />
          <text content="3) Add screens, keymaps, and deterministic state" fg="#e2e8f0" marginTop={1} />
        </box>
        <box style={{ border: true, borderStyle: "single", padding: 1, marginTop: 2, flexDirection: "column" }}>
          <text content="Keys: Ctrl+C quit" fg="#94a3b8" />
          <text content="Tip: Keep expensive panels stable. Avoid re-render storms in lists." fg="#94a3b8" marginTop={1} />
        </box>
      </box>
    </box>
  )
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(renderer).render(<App />)
`,
      counter: `import { createCliRenderer } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"
import { useEffect, useMemo, useState } from "react"

function App() {
  const [count, setCount] = useState(0)
  const startedAt = useMemo(() => Date.now(), [])

  useEffect(() => {
    const timer = setInterval(() => setCount((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const seconds = Math.floor((Date.now() - startedAt) / 1000)

  return (
    <box style={{ width: "100%", height: "100%", padding: 1, flexDirection: "column" }}>
      <box style={{ border: true, borderStyle: "single", padding: 1, width: 60, height: 10, flexDirection: "column" }}>
        <text content="React Counter" fg="#00ff99" />
        <text content={\`Count: \${count}\`} fg="#e2e8f0" marginTop={1} />
        <text content={\`Uptime: \${seconds}s\`} fg="#cbd5e1" marginTop={1} />
        <text content="Ctrl+C to exit" fg="#94a3b8" marginTop={1} />
      </box>
    </box>
  )
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(renderer).render(<App />)
`,
      login: `import { createCliRenderer } from "@cascadetui/core"
import { createRoot, useKeyboard } from "@cascadetui/react"
import { useMemo, useState } from "react"

function App() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [focused, setFocused] = useState<"username" | "password">("username")
  const [status, setStatus] = useState<"idle" | "invalid" | "success">("idle")

  const statusText = useMemo(() => {
    if (status === "success") return "Authenticated"
    if (status === "invalid") return "Invalid credentials"
    return "Idle"
  }, [status])

  useKeyboard((key) => {
    if (key.name === "tab") {
      setFocused((value) => (value === "username" ? "password" : "username"))
      return
    }
    if (key.name === "escape") {
      setUsername("")
      setPassword("")
      setStatus("idle")
      setFocused("username")
      return
    }
  })

  const submit = () => {
    if (username.trim() === "admin" && password === "secret") {
      setStatus("success")
      return
    }
    setStatus("invalid")
  }

  return (
    <box style={{ width: "100%", height: "100%", padding: 2, flexDirection: "column" }}>
      <text content="Cascade Login" fg="#00ff99" />
      <text content="Tab switch fields, Enter submit, Esc reset" fg="#94a3b8" marginTop={1} />
      <box title="Username" style={{ border: true, borderStyle: "single", width: 44, height: 3, marginTop: 2 }}>
        <input focused={focused === "username"} placeholder="admin" value={username} onInput={setUsername} onSubmit={submit} />
      </box>
      <box title="Password" style={{ border: true, borderStyle: "single", width: 44, height: 3, marginTop: 1 }}>
        <input focused={focused === "password"} placeholder="secret" value={password} onInput={setPassword} onSubmit={submit} />
      </box>
      <box style={{ border: true, borderStyle: "single", padding: 1, width: 44, marginTop: 2, flexDirection: "column" }}>
        <text content={\`Status: \${statusText}\`} fg={status === "success" ? "green" : status === "invalid" ? "yellow" : "#cbd5e1"} />
        <text content={\`Focused: \${focused}\`} fg="#94a3b8" marginTop={1} />
      </box>
    </box>
  )
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(renderer).render(<App />)
`,
    },
    solid: {
      minimal: `import { render } from "@cascadetui/solid"

const App = () => (
  <box style={{ width: "100%", height: "100%", padding: 1, flexDirection: "column" }}>
    <box style={{ border: true, borderStyle: "single", padding: 1, width: 72, height: 16, flexDirection: "column" }}>
      <text content="Cascade Solid" fg="#00ff99" />
      <text content="Write reactive terminal apps with signals and components." fg="#cbd5e1" marginTop={1} />
      <box style={{ flexDirection: "column", marginTop: 2 }}>
        <text content="1) Edit src/index.tsx" fg="#e2e8f0" />
        <text content="2) bun run dev" fg="#e2e8f0" marginTop={1} />
        <text content="3) Keep state and rendering deterministic" fg="#e2e8f0" marginTop={1} />
      </box>
      <box style={{ border: true, borderStyle: "single", padding: 1, marginTop: 2, flexDirection: "column" }}>
        <text content="Keys: Ctrl+C quit" fg="#94a3b8" />
        <text content="Tip: Keep list rows stable to avoid selection jumps." fg="#94a3b8" marginTop={1} />
      </box>
    </box>
  </box>
)

render(App, { exitOnCtrlC: true })
`,
      counter: `import { render } from "@cascadetui/solid"
import { createSignal, onCleanup } from "solid-js"

const App = () => {
  const [count, setCount] = createSignal(0)
  const [uptime, setUptime] = createSignal(0)

  const timer = setInterval(() => {
    setCount((value) => value + 1)
    setUptime((value) => value + 1)
  }, 1000)

  onCleanup(() => clearInterval(timer))

  return (
    <box style={{ width: "100%", height: "100%", padding: 1, flexDirection: "column" }}>
      <box style={{ border: true, borderStyle: "single", padding: 1, width: 60, height: 10, flexDirection: "column" }}>
        <text content="Solid Counter" fg="#00ff99" />
        <text content={\`Count: \${count()}\`} fg="#e2e8f0" marginTop={1} />
        <text content={\`Uptime: \${uptime()}s\`} fg="#cbd5e1" marginTop={1} />
        <text content="Ctrl+C to exit" fg="#94a3b8" marginTop={1} />
      </box>
    </box>
  )
}

render(App, { exitOnCtrlC: true })
`,
      input: `import { render } from "@cascadetui/solid"
import { createSignal } from "solid-js"

const App = () => {
  const [value, setValue] = createSignal("")
  const [submitted, setSubmitted] = createSignal("")
  const [status, setStatus] = createSignal<"idle" | "submitted">("idle")

  return (
    <box style={{ width: "100%", height: "100%", padding: 2, flexDirection: "column" }}>
      <text content="Solid Input" fg="#00ff99" />
      <text content="Enter submit, Ctrl+C quit" fg="#94a3b8" marginTop={1} />
      <box title="Message" style={{ border: true, borderStyle: "single", width: 52, height: 3, marginTop: 2 }}>
        <input
          focused
          placeholder="Type something..."
          value={value()}
          onInput={(nextValue) => {
            setValue(nextValue)
            setStatus("idle")
          }}
          onSubmit={(nextValue) => {
            setSubmitted(nextValue)
            setStatus("submitted")
          }}
        />
      </box>
      <box style={{ border: true, borderStyle: "single", padding: 1, width: 52, marginTop: 2, flexDirection: "column" }}>
        <text content={\`Current: \${value() || "-"}\`} fg="#cbd5e1" />
        <text content={\`Last submit: \${submitted() || "-"}\`} fg="#cbd5e1" marginTop={1} />
        <text content={\`Status: \${status()}\`} fg={status() === "submitted" ? "green" : "#94a3b8"} marginTop={1} />
      </box>
    </box>
  )
}

render(App, { exitOnCtrlC: true })
`,
    },
  }

  return sources[framework][starter]
}

function writeProject(targetDir, projectName, framework, starter) {
  mkdirSync(targetDir, { recursive: true })
  ensureDirectoryIsEmpty(targetDir)
  mkdirSync(resolve(targetDir, "src"), { recursive: true })

  const packageJson = getPackageJson(projectName, framework)
  const tsconfig = getTsConfig(framework)
  const isJsx = framework !== "core"
  const fileName = isJsx ? "index.tsx" : "index.ts"
  const source = getSource(framework, starter)

  writeFileSync(resolve(targetDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`)
  writeFileSync(resolve(targetDir, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`)
  writeFileSync(resolve(targetDir, "src", fileName), source)

  if (framework === "solid") {
    writeFileSync(resolve(targetDir, "bunfig.toml"), 'preload = ["@cascadetui/solid/preload"]\n')
  }
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`)
  }
}

async function main() {
  const { options, positionals } = parseArgs(process.argv)
  if (options.help) {
    printHelp()
    return
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    let framework
    let projectName
    let location
    let starter

    if (shouldRunInteractiveWizard(options, positionals)) {
      framework = await resolveFramework(rl, undefined)
      projectName = await resolveProjectName(rl, [], "cascade-app")
      location = await resolveLocation(rl, { ...options, here: false }, [])
      starter = await resolveStarter(rl, framework, undefined)
    } else {
      framework = await resolveFramework(rl, options.framework)
      location = await resolveLocation(rl, options, positionals)
      const defaultName = location === "here" ? basename(process.cwd()) : "cascade-app"
      projectName = await resolveProjectName(rl, positionals, defaultName)
      starter = await resolveStarter(rl, framework, options.starter)
    }

    const usingCurrentDirectory = location === "here"
    const targetDir = usingCurrentDirectory ? process.cwd() : resolve(process.cwd(), projectName)
    const packageNameSeed = projectName

    writeProject(targetDir, packageNameSeed, framework, starter)

    console.log("")
    console.log(`Created Cascade project in ${targetDir}`)
    console.log(`Framework: ${framework}`)
    console.log(`Starter: ${starter}`)

    if (options.install) {
      console.log("")
      console.log("Installing dependencies with bun...")
      runCommand("bun", ["install"], targetDir)
    }

    if (options.start) {
      console.log("")
      console.log("Starting the project...")
      runCommand("bun", ["run", "dev"], targetDir)
      return
    }

    console.log("")
    console.log("Next steps:")
    if (!usingCurrentDirectory) {
      console.log(`  cd ${projectName}`)
    }
    console.log("  bun install")
    console.log("  bun run dev")
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})