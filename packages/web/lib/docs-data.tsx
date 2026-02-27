import type { ReactNode } from "react"
import { CodeBlock } from "@/components/code-block"

export type DocSection = {
  id: string
  title: string
  searchText: string
  content: ReactNode
}

export type DocPage = {
  id: string
  group: string
  title: string
  subtitle?: ReactNode
  sections: DocSection[]
}

export const docPages: DocPage[] = [
  {
    id: "overview",
    group: "Introduction",
    title: "Overview",
    subtitle:
      "Cascade is a native terminal UI runtime and component model, written in Zig with TypeScript APIs. This documentation introduces the architecture, core concepts, components, bindings and reference topics.",
    sections: [
      {
        id: "quick-start",
        title: "Quick start",
        searchText: "cascade quick start bun create cascade install run project",
        content: (
          <>
            <p>Get up and running by scaffolding a new project and executing your first interactive application.</p>
            <p>Use the Bun package manager to create a Cascade project and start it in development mode.</p>
            <CodeBlock
              language="bash"
              code={`bun create @cascadetui/create-cascade my-app
cd my-app
bun install
bun run dev`}
            />
            <p>The generated project typically includes a single entry file, a minimal demo UI and scripts for development and production.  Start by making a small change (like updating a label) and re-run <code>bun run dev</code> to confirm your workflow.</p>
            <p>When troubleshooting, keep these quick checks in mind: verify your terminal supports the required features (mouse, alternate screen), confirm the app exits cleanly, and enable the built‑in console overlay for logs.</p>
            <CodeBlock
              language="bash"
              code={`# Run with additional runtime diagnostics
CASCADE_LOG_CRASH_REPORTS=1 bun run dev`}
            />
          </>
        ),
      },
      {
        id: "documentation-map",
        title: "Documentation map",
        searchText: "overview core concepts components bindings reference",
        content: (
          <>
            <p>The rest of the documentation is organised by topic.  Core Concepts explain how the renderer works, how to build and compose renderables, and how to manage lifecycle and input.  Components provide examples of each built‑in terminal primitive.  Bindings show how to use Cascade with frameworks like Solid and React.  Reference covers environment variables and Tree‑sitter integration.</p>
            <p>If you are new to Cascade, read in this order: Renderer, Renderables, Layout, Keyboard, then the component pages you need for your UI (Text, Box, Input, ScrollBox, Diff).  For app‑style architecture, the Solid/React bindings help you structure state and events cleanly.</p>
          </>
        ),
      },
      {
        id: "overview-cheat-sheet",
        title: "Cheat sheet",
        searchText: "overview cheat sheet packages entrypoints core react solid create-cascade constructs renderables",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Goal</th>
                    <th>Use</th>
                    <th>Minimal snippet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Start a new app</td>
                    <td><code className="doc-pill" title="create-cascade">create-cascade</code></td>
                    <td><code className="doc-pill" title="bun create cascade">bun create cascade</code></td>
                  </tr>
                  <tr>
                    <td>Imperative UI</td>
                    <td><code className="doc-pill" title="@cascadetui/core">@cascadetui/core</code> renderables</td>
                    <td><code className="doc-pill" title="new BoxRenderable">new BoxRenderable(renderer, ...)</code></td>
                  </tr>
                  <tr>
                    <td>Declarative (no framework)</td>
                    <td><code className="doc-pill" title="constructs">constructs</code> + <code className="doc-pill" title="instantiate">instantiate</code></td>
                    <td><code className="doc-pill" title="instantiate(renderer, vnode)">instantiate(renderer, vnode)</code></td>
                  </tr>
                  <tr>
                    <td>React UI</td>
                    <td><code className="doc-pill" title="@cascadetui/react">@cascadetui/react</code></td>
                    <td><code className="doc-pill" title="createRoot(renderer).render">createRoot(renderer).render(...)</code></td>
                  </tr>
                  <tr>
                    <td>Solid UI</td>
                    <td><code className="doc-pill" title="@cascadetui/solid">@cascadetui/solid</code></td>
                    <td><code className="doc-pill" title="render(() => <App />)">render(() =&gt; &lt;App /&gt;)</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Tip: if you’re unsure which approach to pick, start with React or Solid for app-like UIs (state + composition). Use renderables for low-level control or when you want to mutate objects in-place.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "tutorial-mini-app",
    group: "Guides",
    title: "Tutorial: Build a mini app",
    subtitle: "From hello world to a small multi-panel interactive TUI.",
    sections: [
      {
        id: "goal-and-mental-model",
        title: "Goal and mental model",
        searchText: "tutorial mini app goal mental model renderer root renderables constructs",
        content: (
          <>
            <p>This tutorial builds a small terminal application with a sidebar, a main panel, and a command input.  It is intentionally simple, but demonstrates the patterns you will reuse in real apps:</p>
            <p>- a single renderer instance for the process
            <br />- a root UI shell (header/body/footer)
            <br />- keyboard routing (global shortcuts vs focused input)
            <br />- updating UI in place</p>
            <p>If you prefer declarative composition, use constructs.  If you prefer runtime object control, use renderables.  The tutorial sticks to renderables first, then shows a construct version.</p>
          </>
        ),
      },
      {
        id: "project-setup",
        title: "Project setup",
        searchText: "tutorial setup bun create createCliRenderer typescript entry file",
        content: (
          <>
            <p>Create a new project with the generator, then run the dev script.  In this tutorial we assume your entry file is <code>src/index.ts</code>.</p>
            <CodeBlock
              language="bash"
              code={`bun create @cascadetui/create-cascade my-app
cd my-app
bun install
bun run dev`}
            />
            <p>Keep the built-in console enabled in development so you can see logs while the UI is running.</p>
          </>
        ),
      },
      {
        id: "tutorial-config-cheats",
        title: "Renderer config cheats",
        searchText: "tutorial renderer config cheats exitOnCtrlC useMouse useAlternateScreen useConsole targetFps",
        content: (
          <>
            <p>These are the most common <code>createCliRenderer</code> knobs used in real apps:</p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Type</th>
                    <th>Typical</th>
                    <th>Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="exitOnCtrlC">exitOnCtrlC</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="true">true</code></td>
                    <td>Quits cleanly on Ctrl+C and restores terminal state.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useAlternateScreen">useAlternateScreen</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="true">true</code></td>
                    <td>Keeps UI isolated (no log spam in your shell history).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useMouse">useMouse</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="true">true</code></td>
                    <td>Enables click/drag/scroll interactions and selection.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useConsole">useConsole</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="true">true</code></td>
                    <td>Makes logs visible even in alternate screen mode.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="targetFps">targetFps</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td><code className="doc-pill" title="30">30</code></td>
                    <td>Sets animation/render loop target (use only if you need continuous rendering).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "renderer-and-shell",
        title: "Create a renderer and a basic shell",
        searchText: "tutorial renderer shell header footer sidebar main BoxRenderable TextRenderable flex",
        content: (
          <>
            <p>Start by creating a renderer and a three-part layout: header, body, footer.  The body is a row with a fixed sidebar and a flexible main panel.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  useAlternateScreen: true,
  useMouse: true,
})

const header = new BoxRenderable(renderer, { height: 3, border: true, paddingLeft: 1, alignItems: "center" })
header.add(new TextRenderable(renderer, { content: "Mini App" }))

const footer = new BoxRenderable(renderer, { height: 3, border: true, paddingLeft: 1, alignItems: "center" })
const footerText = new TextRenderable(renderer, { content: "Ctrl+C to quit" })
footer.add(footerText)

const body = new BoxRenderable(renderer, { flexGrow: 1, flexDirection: "row" })
const sidebar = new BoxRenderable(renderer, { width: 22, border: true, padding: 1 })
const main = new BoxRenderable(renderer, { flexGrow: 1, border: true, padding: 1, marginLeft: 1 })

sidebar.add(new TextRenderable(renderer, { content: "Commands" }))
main.add(new TextRenderable(renderer, { content: "Ready" }))

body.add(sidebar)
body.add(main)

renderer.root.add(header)
renderer.root.add(body)
renderer.root.add(footer)`}
            />
            <p>This is the “shell” pattern: your app always renders the shell, and the shell swaps the inner main content based on state.</p>
          </>
        ),
      },
      {
        id: "input-and-state",
        title: "Add input, state, and updates",
        searchText: "tutorial input state update TextRenderable content onSubmit",
        content: (
          <>
            <p>Next, add an input at the bottom (or inside the footer).  When the user submits, update the main panel and append a line to a log area.</p>
            <CodeBlock
              language="ts"
              code={`import { InputRenderable, TextRenderable, BoxRenderable } from "@cascadetui/core"

const log = new TextRenderable(renderer, { content: "" })
main.add(log)

const input = new InputRenderable(renderer, {
  placeholder: "Type a command",
  onSubmit: (value) => {
    log.content = (log.content ? log.content + "\n" : "") + "> " + value
    footerText.content = "Last command: " + value
  },
})

footer.add(input)
input.focus()`}
            />
            <p>In small apps, updating renderables in place is the simplest approach.  In larger apps, keep state in a single store and render from state via constructs or framework bindings.</p>
          </>
        ),
      },
      {
        id: "global-shortcuts",
        title: "Global shortcuts and focus",
        searchText: "tutorial global shortcuts focus routing tab escape",
        content: (
          <>
            <p>Global key handlers are great for app-wide shortcuts.  Keep them small and predictable (quit/help/debug).  Route editing keys to the focused input.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("key", (event) => {
  if (event.name === "?") {
    footerText.content = "Help: type anything and press Enter"
  }
  if (event.name === "escape") {
    input.focus()
  }
})`}
            />
          </>
        ),
      },
      {
        id: "cleanup",
        title: "Cleanup",
        searchText: "tutorial cleanup destroyRecursively renderer.destroy shutdown",
        content: (
          <>
            <p>Always call <code>renderer.destroy()</code> to restore terminal state.  If you created many renderables dynamically, keep a single destroy path and call <code>destroyRecursively()</code> on your root nodes when switching screens.</p>
            <CodeBlock
              language="ts"
              code={`renderer.onDestroy(() => {
  // stop timers, close sockets, flush logs
})

renderer.destroy()`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "focus-and-routing",
    group: "Guides",
    title: "Focus and input routing",
    subtitle: "How keyboard events flow through your UI and how to manage focus predictably.",
    sections: [
      {
        id: "definition",
        title: "What is focus?",
        searchText: "focus definition routing keyboard input focused renderable",
        content: (
          <>
            <p>Focus determines which element receives keyboard events.  In practice, you want:</p>
            <p>- global shortcuts handled at the renderer level
            <br />- editing/navigation handled by the focused widget (input, list, editor)
            <br />- a predictable way to move focus between widgets (Tab / Shift+Tab)</p>
          </>
        ),
      },
      {
        id: "focus-apis",
        title: "Focus APIs",
        searchText: "focus apis focus blur focused autoFocus id getRenderable focus manager",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Concept</th>
                    <th>Where</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="focus()">focus()</code></td>
                    <td>Renderable instance</td>
                    <td>Routes keyboard input to this node (common for inputs/selects/textareas).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="focused">focused</code></td>
                    <td>React/Solid prop</td>
                    <td>Convenient way to request focus on mount (use sparingly; prefer explicit focus manager for complex apps).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="id">id</code></td>
                    <td>All nodes</td>
                    <td>Use stable ids to implement predictable tab order and focus restore.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="renderer.root.getRenderable">renderer.root.getRenderable(id)</code></td>
                    <td>Renderer root</td>
                    <td>Lookup helper for imperative focus routing.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "focusable-list-pattern",
        title: "A simple focus manager",
        searchText: "focus manager tab shift tab focusable ids",
        content: (
          <>
            <p>For multi-panel UIs, a small focus manager is often enough.  Keep an ordered list of focusable ids and wrap around when tabbing.</p>
            <CodeBlock
              language="ts"
              code={`const focusOrder = ["search", "results", "command"]
let focusIndex = 0

function focusById(id: string) {
  const node = renderer.root.getRenderable(id)
  node?.focus?.()
}

renderer.on("key", (event) => {
  if (event.name !== "tab") return
  focusIndex = (focusIndex + 1) % focusOrder.length
  focusById(focusOrder[focusIndex]!)
})`}
            />
            <p>If your UI mounts/unmounts widgets, update the focus order at the same time, otherwise focus will “jump” unexpectedly.</p>
          </>
        ),
      },
      {
        id: "recipe-modal-focus",
        title: "Recipe: modal focus trap",
        searchText: "focus modal trap escape enter overlay",
        content: (
          <>
            <p>When you open a modal, focus should stay inside it.  A simple pattern is to keep a boolean <code>isModalOpen</code> and override Tab routing while it is open.</p>
            <CodeBlock
              language="ts"
              code={`let isModalOpen = false

renderer.on("key", (event) => {
  if (event.name === "escape" && isModalOpen) {
    isModalOpen = false
    focusById("command")
    return
  }

  if (event.name === "tab" && isModalOpen) {
    // tab inside modal only
    focusById("modal-input")
  }
})`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "debugging-and-diagnostics",
    group: "Guides",
    title: "Debugging and diagnostics",
    subtitle: "Logging, crash reports, and practical debugging patterns for TUIs.",
    sections: [
      {
        id: "logs-in-terminal-ui",
        title: "Logs in a terminal UI",
        searchText: "debugging logs console overlay stdout stderr",
        content: (
          <>
            <p>When you run a terminal UI, stdout/stderr may not be visible (alternate screen).  In development, enable the built-in console overlay and write logs to it.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer({
  useConsole: true,
  consoleOptions: {
    title: "Runtime Logs",
    startInDebugMode: true,
    position: "bottom",
    height: 10,
  },
})

renderer.console.show()
console.log("Renderer started")`}
            />
          </>
        ),
      },
      {
        id: "crash-reporting",
        title: "Crash reporting",
        searchText: "debugging crash reports logCrashReportsToConsole errors",
        content: (
          <>
            <p>Enable crash reporting in development so native failures are surfaced quickly.  In production, log crash reports to disk or ship them to your telemetry pipeline.</p>
            <CodeBlock
              language="bash"
              code={`CASCADE_LOG_CRASH_REPORTS=1 bun run dev`}
            />
          </>
        ),
      },
      {
        id: "recipe-debug-key",
        title: "Recipe: a debug hotkey",
        searchText: "debugging hotkey ctrl+d toggle console",
        content: (
          <>
            <p>In almost every app, add a single debug hotkey that toggles the console overlay.  This makes it easy to capture runtime information without breaking the UI.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("key", (event) => {
  if (event.ctrl && event.name === "d") {
    renderer.console.toggle()
  }
})`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "renderer",
    group: "Core Concepts",
    title: "Renderer",
    subtitle: "Terminal I/O, scheduling and runtime composition.",
    sections: [
      {
        id: "what-is-a-renderer",
        title: "What is a renderer?",
        searchText: "renderer definition terminal io scheduling frame loop root events",
        content: (
          <>
            <p>The renderer is the runtime object that drives Cascade.  It is responsible for:</p>
            <p>- terminal setup (raw mode, alternate screen, mouse)
            <br />- input decoding (keyboard, mouse)
            <br />- composing your UI tree through the root renderable
            <br />- scheduling frames (when and how often the terminal is redrawn)
            <br />- cleanup (restoring the terminal state on exit)</p>
            <p>Most applications have exactly one renderer instance for the lifetime of the process.</p>
          </>
        ),
      },
      {
        id: "creating-a-renderer",
        title: "Creating a renderer",
        searchText: "createCliRenderer options exitOnCtrlC targetFps useMouse useAlternateScreen",
        content: (
          <>
            <p>Create a renderer with <code>createCliRenderer</code>.  You typically enable Ctrl+C exit, mouse support, and an alternate screen for a clean UI.</p>
            <CodeBlock
              language="ts"
              code={`import { createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 30,
  useMouse: true,
  useAlternateScreen: true,
})`}
            />
            <p>If you are building a “single-shot” UI (render once, then exit), you can still use the renderer, mount a tree, and destroy immediately after you are done.  Most apps keep it alive.</p>
          </>
        ),
      },
      {
        id: "renderer-config-reference",
        title: "Config reference (common options)",
        searchText: "renderer config reference useConsole consoleOptions openConsoleOnError logCrashReportsToConsole useKittyKeyboard",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="useConsole">useConsole</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="false">false</code></td>
                    <td>Shows an in-UI console overlay that captures logs (recommended in development).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="consoleOptions">consoleOptions</code></td>
                    <td><code className="doc-pill" title="ConsoleOptions">ConsoleOptions</code></td>
                    <td><code className="doc-pill" title="-">-</code></td>
                    <td>Customizes position/height/title/debug mode of the console overlay.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="openConsoleOnError">openConsoleOnError</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="false">false</code></td>
                    <td>Opens the console automatically when a crash report is captured.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="logCrashReportsToConsole">logCrashReportsToConsole</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="false">false</code></td>
                    <td>Prints crash report details via <code>console.error</code> (useful in CI / debugging).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useKittyKeyboard">useKittyKeyboard</code></td>
                    <td><code className="doc-pill" title="KittyKeyboardOptions | null">KittyKeyboardOptions | null</code></td>
                    <td><code className="doc-pill" title="undefined">undefined</code></td>
                    <td>Enables enhanced keyboard protocol features on terminals that support it.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "root-renderable",
        title: "The root renderable",
        searchText: "renderer.root RootRenderable add remove fills terminal resize",
        content: (
          <>
            <p>Every renderer has a <code>root</code> renderable.  It behaves like the top container of your UI tree: it fills the terminal and updates its size on resize.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable } from "@cascadetui/core"

const root = renderer.root
const panel = new BoxRenderable(renderer, { width: 40, height: 6, border: true, padding: 1 })
panel.add(new TextRenderable(renderer, { content: "Hello from root" }))
root.add(panel)`}
            />
            <p>With constructs (the declarative API), you add VNodes to the root as well (after instantiation).</p>
          </>
        ),
      },
      {
        id: "render-loop-modes",
        title: "Render loop control",
        searchText: "renderer start stop requestLive dropLive pause suspend resume render loop modes fps",
        content: (
          <>
            <p>Cascade supports multiple ways of driving rendering.  Which one you use depends on whether your UI is static, interactive, or animated.</p>
            <p><strong>On-demand rendering</strong>: if you never call <code>start()</code>, Cascade can redraw only when the UI tree changes.</p>
            <p><strong>Continuous rendering</strong>: call <code>start()</code> to render continuously at the target FPS (useful for highly dynamic UIs).</p>
            <CodeBlock
              language="ts"
              code={`renderer.start()

setTimeout(() => {
  renderer.stop()
}, 2000)`}
            />
            <p><strong>Live rendering</strong>: for short animations, request live mode temporarily.  This pattern avoids running a full render loop forever.</p>
            <CodeBlock
              language="ts"
              code={`renderer.requestLive()

setTimeout(() => {
  renderer.dropLive()
}, 400)`}
            />
            <p><strong>Pause vs suspend</strong>: pausing stops drawing but keeps the terminal configured; suspending fully releases control (mouse/input/raw mode) until resumed.</p>
            <CodeBlock
              language="ts"
              code={`renderer.pause()
renderer.resume()

renderer.suspend()
renderer.resume()`}
            />
          </>
        ),
      },
      {
        id: "events-and-theme",
        title: "Events and runtime signals",
        searchText: "renderer events resize destroy theme mode theme_mode cursor input",
        content: (
          <>
            <p>The renderer emits runtime events.  The most important is <code>resize</code>, which you can use to recompute layout or update derived state.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("resize", (width, height) => {
  console.log(\`Resize: \${width}x\${height}\`)
})`}
            />
            <p>If you build apps that must react to theme changes (dark/light), keep your “theme tokens” in a single place and update component colors when the mode changes.</p>
          </>
        ),
      },
      {
        id: "cleanup-and-exit",
        title: "Cleanup and exit",
        searchText: "renderer destroy onDestroy exitOnCtrlC signals cleanup restore terminal",
        content: (
          <>
            <p>Always destroy the renderer before exiting.  This restores terminal state (cursor, input modes, alternate screen) and avoids leaving the terminal in a broken state.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer({ exitOnCtrlC: false })

renderer.on("key", (event) => {
  if (event.ctrl && event.name === "c") {
    renderer.destroy()
  }
})`}
            />
            <p>If you have background resources (timers, sockets, file watchers), treat <code>destroy</code> as your single shutdown hook and stop everything there.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "renderables",
    group: "Core Concepts",
    title: "Renderables",
    subtitle: "Building blocks and composition of UI.",
    sections: [
      {
        id: "about-renderables",
        title: "Renderables",
        searchText: "renderables BoxRenderable TextRenderable InputRenderable tree add remove focus events mouse layout",
        content: (
          <>
            <p>Renderables are concrete runtime instances attached to a renderer context.  They represent visual elements such as boxes, text and inputs.  You create them with their constructors and then attach them to the renderer’s root or to other renderables.  Cascade provides built‑in classes like <code>BoxRenderable</code>, <code>TextRenderable</code> and <code>InputRenderable</code>.</p>
            <p>Renderables form a tree.  Use the <code>add</code> method to append a child and <code>remove</code> to detach it.  Layout properties such as <code>width</code>, <code>height</code>, <code>flexGrow</code> and padding work similarly to flexbox, allowing nested and responsive layouts.  Renderables can receive focus and handle keyboard and mouse events.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable } from "@cascadetui/core"

const panel = new BoxRenderable(renderer, { width: 40, border: true, padding: 1 })
panel.add(new TextRenderable(renderer, { content: "Runtime instance" }))
renderer.root.add(panel)`}
            />
            <p>Because renderables are runtime objects, you can update them in place: change content, toggle visibility, or swap children.  This is a good fit for dashboards, log viewers, or any UI that updates frequently.</p>
            <CodeBlock
              language="ts"
              code={`const status = new TextRenderable(renderer, { content: "Starting..." })
panel.add(status)

setInterval(() => {
  status.content = \`Tick: \${Date.now()}\`
}, 250)`}
            />
            <p>Interactive renderables support event handlers.  For example, an input can invoke a callback when the value changes or when the user submits.</p>
            <CodeBlock
              language="ts"
              code={`import { InputRenderable } from "@cascadetui/core"

const input = new InputRenderable(renderer, {
  placeholder: "Enter name",
  onSubmit: (value) => console.log(value),
})
renderer.root.add(input)`}
            />
            <p>Detach elements by id when you no longer need them, or when switching screens.</p>
            <CodeBlock
              language="ts"
              code={`renderer.root.remove(panel.id)
panel.destroyRecursively()`}
            />
          </>
        ),
      },
      {
        id: "renderables-tree-apis",
        title: "Tree APIs",
        searchText: "renderables tree apis add remove destroyRecursively getRenderable children parent",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Where</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="add(child)">add(child)</code></td>
                    <td>Container renderables</td>
                    <td>Appends a child node to the renderable tree.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="remove(id)">remove(id)</code></td>
                    <td>Container renderables</td>
                    <td>Detaches a child by id (does not necessarily destroy it).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="destroyRecursively()">destroyRecursively()</code></td>
                    <td>Any renderable</td>
                    <td>Destroys a subtree; use when switching screens to avoid leaks.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="renderer.root.getRenderable">renderer.root.getRenderable(id)</code></td>
                    <td>Root</td>
                    <td>Lookup by stable id (useful for focus management and imperative updates).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "constructs",
    group: "Core Concepts",
    title: "Constructs",
    subtitle: "Declarative VNodes and reusable factories.",
    sections: [
      {
        id: "about-constructs",
        title: "Constructs",
        searchText: "constructs Box Text Input instantiate delegate VNode declarative composition",
        content: (
          <>
            <p>Constructs provide a declarative API for building UI hierarchies.  Functions like <code>Box</code>, <code>Text</code> and <code>Input</code> return virtual nodes (VNodes).  These VNodes describe the tree structure and properties without immediately allocating runtime instances.  The VNodes are turned into renderables later via <code>instantiate</code>.</p>
            <p>Constructs encourage composition.  You can nest them to build complex layouts, and you can encapsulate behaviour with factories.  The <code>delegate</code> helper forwards focus and events to a child component, enabling form‑like patterns.</p>
            <CodeBlock
              language="ts"
              code={`import { Box, Text, Input, instantiate, delegate } from "@cascadetui/core"
 
const form = delegate(
  { focus: "username" },
  Box(
    { border: true, padding: 1 },
    Text({ content: "Login" }),
    Input({ id: "username", placeholder: "user" }),
  ),
)
 
const node = instantiate(renderer, form)
renderer.root.add(node)`}
            />
            <p>Because constructs are plain functions, it’s easy to build reusable UI factories that accept options and return a VNode.  This is also a good place to standardize styling (padding, borders, colors) across your application.</p>
            <p>You can build custom constructs as pure functions that return a VNode, enabling reuse across your application.</p>
            <CodeBlock
              language="ts"
              code={`import { Box, Text } from "@cascadetui/core"
 
function Card(title: string, content: string) {
  return Box(
    { border: true, padding: 1, flexGrow: 1 },
    Text({ content: title }),
    Text({ content }),
  )
}
 
const app = Box({ flexDirection: "row" }, Card("A", "First"), Card("B", "Second"))`}
            />
            <p>Constructs also make conditional rendering straightforward.  You can return different trees based on state, then instantiate the result.</p>
            <CodeBlock
              language="ts"
              code={`import { Box, Text } from "@cascadetui/core"

function EmptyState(message: string) {
  return Box({ border: true, padding: 1 }, Text({ content: message }))
}

const vnode = items.length === 0 ? EmptyState("No results") : Box({}, Text({ content: "Results..." }))`}
            />
          </>
        ),
      },
      {
        id: "constructs-reference",
        title: "Reference (core helpers)",
        searchText: "constructs reference instantiate h delegate fragments children props",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Helper</th>
                    <th>Purpose</th>
                    <th>When to use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="instantiate">instantiate(renderer, vnode)</code></td>
                    <td>Turns VNodes into runtime renderables.</td>
                    <td>Mount construct trees into the renderer root.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="delegate">delegate(config, vnode)</code></td>
                    <td>Forwards focus/events to a specific child.</td>
                    <td>Forms: keep a container focused while delegating editing to a field.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="Box/Text/Input">Box / Text / Input</code></td>
                    <td>Convenient VNode factories matching core renderables.</td>
                    <td>Reusable composition with predictable structure.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "renderables-vs-constructs",
    group: "Core Concepts",
    title: "Renderables vs Constructs",
    subtitle: "Imperative and declarative composition compared.",
    sections: [
      {
        id: "comparison",
        title: "Comparison",
        searchText: "renderables vs constructs imperative declarative control flexibility reuse",
        content: (
          <>
            <p>The Cascade API supports both imperative and declarative approaches.  Renderables give you direct access to runtime objects and allow imperative manipulation: you can create instances, call methods and set properties at any time.  This is useful for low‑level control or dynamic updates.</p>
            <p>Constructs, on the other hand, produce virtual nodes that are instantiated later.  They encourage a declarative style similar to JSX or Solid/React components and make it easy to reuse factories or build higher‑order patterns.</p>
            <p>Both models can coexist.  Use renderables when you need explicit control, such as integrating with imperative APIs or performing incremental updates.  Use constructs when composition and reuse are priorities.  You can even mix them: instantiate a construct and then access the underlying renderables for custom behaviour.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable } from "@cascadetui/core"\n\nconst panel = new BoxRenderable(renderer, { border: true, padding: 1 })\npanel.add(new TextRenderable(renderer, { content: "Imperative" }))\nrenderer.root.add(panel)\n\nimport { Box, Text, instantiate } from "@cascadetui/core"\n\nconst vnode = Box({ border: true, padding: 1 }, Text({ content: "Declarative" }))\nconst node = instantiate(renderer, vnode)\nrenderer.root.add(node)`}
            />
            <p>If you’re building a component library or want a “UI as data” style, start with constructs.  If you’re building highly dynamic experiences (custom editors, terminals that stream content, animations), renderables can be a simpler mental model.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "layout",
    group: "Core Concepts",
    title: "Layout",
    subtitle: "Box model and flex‑like composition.",
    sections: [
      {
        id: "layout-definition",
        title: "Layout model",
        searchText: "layout definition yoga flexbox box model",
        content: (
          <>
            <p>Cascade layout is box-based and uses a Yoga-like flex engine.  Every element participates in layout, so you can build complex terminal UIs without manually computing coordinates.</p>
            <p>In practice, you will spend most of your time with:</p>
            <p>- <code>flexDirection</code>
            <br />- <code>justifyContent</code>
            <br />- <code>alignItems</code>
            <br />- <code>width</code> / <code>height</code>
            <br />- <code>flexGrow</code> / <code>flexShrink</code>
            <br />- <code>padding</code> / <code>margin</code>
            <br />- <code>position</code> + offsets for overlays</p>
          </>
        ),
      },
      {
        id: "flexbox-basics",
        title: "Flexbox basics",
        searchText: "layout flexDirection justifyContent alignItems flexbox row column",
        content: (
          <>
            <p>Use a row container to place panels side-by-side.  One panel can be fixed width, the other can grow to fill remaining space.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" width="100%" height="100%" padding={1}>
  <box width={24} border padding={1}>
    <text content="Sidebar" />
  </box>
  <box flexGrow={1} border padding={1}>
    <text content="Main content" />
  </box>
</box>`}
            />
            <p>Use <code>justifyContent</code> to distribute children along the main axis and <code>alignItems</code> along the cross axis.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%" height={3}>
  <text content="Left" />
  <text content="Center" />
  <text content="Right" />
</box>`}
            />
          </>
        ),
      },
      {
        id: "sizing",
        title: "Sizing (fixed, percentage, grow/shrink)",
        searchText: "layout sizing width height percent flexGrow flexShrink minWidth maxWidth",
        content: (
          <>
            <p>You can mix fixed and percentage sizing.  Use fixed sizes for navigation sidebars and toolbars, and use flex growth for main content.</p>
            <p>Guideline: if a child should fill remaining space, set <code>flexGrow</code> to 1.  If it should stay fixed, keep <code>flexGrow</code> at 0 and provide an explicit width/height.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" width="100%" height={10}>
  <box width="30%" border />
  <box width="70%" border />
</box>`}
            />
          </>
        ),
      },
      {
        id: "positioning-overlays",
        title: "Positioning and overlays",
        searchText: "layout positioning absolute relative overlay modal tooltip",
        content: (
          <>
            <p>Use absolute positioning for overlays: toasts, tooltips, modals, floating help.  Keep overlays in a dedicated layer (higher <code>zIndex</code>) when you have multiple stacked elements.</p>
            <CodeBlock
              language="tsx"
              code={`<box width="100%" height="100%">
  <box flexGrow={1} border />
  <box position="absolute" right={1} bottom={1} border padding={1} backgroundColor="#24283b">
    <text content="Saved" />
  </box>
</box>`}
            />
          </>
        ),
      },
      {
        id: "imperative-layout",
        title: "Imperative layout",
        searchText: "layout imperative BoxRenderable flexDirection justifyContent alignItems",
        content: (
          <>
            <p>In imperative code you set the same flex properties directly on renderables.  This approach is useful when you want to compute sizes from terminal dimensions.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable } from "@cascadetui/core"

const header = new BoxRenderable(renderer, { height: 3, border: true, alignItems: "center" })
header.add(new TextRenderable(renderer, { content: "LAYOUT DEMO" }))

const content = new BoxRenderable(renderer, { flexGrow: 1, flexDirection: "row" })
const sidebar = new BoxRenderable(renderer, { width: 24, border: true })
const main = new BoxRenderable(renderer, { flexGrow: 1, border: true, marginLeft: 1 })

content.add(sidebar)
content.add(main)

renderer.root.add(header)
renderer.root.add(content)`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "keyboard",
    group: "Core Concepts",
    title: "Keyboard",
    subtitle: "Handling key events and shortcuts.",
    sections: [
      {
        id: "keyboard-basics",
        title: "Basic key handling",
        searchText: "keyboard basics key event name sequence ctrl alt shift meta option",
        content: (
          <>
            <p>Keyboard events include the key name and modifier flags (<code>ctrl</code>, <code>alt</code>, <code>shift</code>).  You can listen globally on the renderer to implement application shortcuts.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("key", (event) => {
  console.log("Key:", event.name)
  console.log("Ctrl:", event.ctrl)
  console.log("Alt:", event.alt)
  console.log("Shift:", event.shift)
})`}
            />
            <p>Use this approach for app-wide shortcuts like quit, help, toggles, and navigation between screens.</p>
          </>
        ),
      },
      {
        id: "common-patterns",
        title: "Common patterns",
        searchText: "keyboard patterns ctrl+c esc enter arrows function keys tab focus",
        content: (
          <>
            <p>Common patterns include quitting on Ctrl+C, showing help on <code>?</code>, opening a debug overlay on Ctrl+D, and switching focus with Tab.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("key", (event) => {
  if (event.ctrl && event.name === "c") renderer.destroy()
  if (event.name === "?") renderer.console.toggle()
})`}
            />
            <p>For component-level keyboard interactions, attach <code>onKey</code> handlers to interactive components (inputs, lists, editors) so the behaviour is scoped to focus.</p>
            <CodeBlock
              language="tsx"
              code={`<input
  placeholder="Search"
  onKey={(event) => {
    if (event.name === "enter") submit()
    if (event.name === "escape") cancel()
  }}
/>`}
            />
          </>
        ),
      },
      {
        id: "paste-and-text-input",
        title: "Paste events",
        searchText: "keyboard paste event text",
        content: (
          <>
            <p>Pasted text should be handled separately from per-key input.  If you implement your own editor, treat paste as an atomic insertion into the buffer.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("paste", (event) => {
  console.log("Pasted:", event.text)
})`}
            />
          </>
        ),
      },
      {
        id: "focus-and-routing",
        title: "Focus and key routing",
        searchText: "keyboard focus routing focused component",
        content: (
          <>
            <p>Focus matters: global handlers are useful for app-wide shortcuts, but per-component handlers make it easier to build isolated widgets.  A typical pattern is to handle “quit” globally, but leave editing/navigation to the focused component.</p>
            <p>When building multi-panel apps, implement a small focus manager.  Keep an ordered list of focusable ids and move focus on Tab / Shift+Tab.  This keeps navigation predictable even as panels mount and unmount.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "console",
    group: "Core Concepts",
    title: "Console",
    subtitle: "Embedded logging overlay.",
    sections: [
      {
        id: "about-console",
        title: "Console",
        searchText: "console overlay logging debug mode position size color toggle shortcuts",
        content: (
          <>
            <p>The built‑in console captures standard output and error streams and overlays them within your terminal UI.  You can enable it when creating the renderer by setting <code>useConsole</code> to <code>true</code> and customise its size, colours and starting mode.</p>
            <p>Toggle the console programmatically or via keyboard shortcuts.  The default keybinding is Ctrl+D.  You can choose the position (top or bottom), specify width and height percentages and configure a title.  Logs printed via <code>console.log</code> will appear in the overlay.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer({
  useConsole: true,
  consoleOptions: {
    title: "Runtime Logs",
    startInDebugMode: true,
    position: "bottom",
    height: 10,
  },
})
renderer.console.show()
console.log("Renderer started")`}
            />
            <p>The console can be toggled on and off at runtime:</p>
            <CodeBlock
              language="ts"
              code={`renderer.console.toggle()`}
            />
            <p>A useful pattern is to leave the console hidden for end users and only enable it in development builds or when a debug flag is set.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "colors",
    group: "Core Concepts",
    title: "Colors",
    subtitle: "Parsing and applying colour values.",
    sections: [
      {
        id: "about-colors",
        title: "Colors",
        searchText: "colors parseColor RGBA hex named values alpha transparency text attributes",
        content: (
          <>
            <p>Color inputs in Cascade accept named values (like <code>orange</code>), hexadecimal strings and RGBA objects.  The <code>parseColor</code> helper converts strings into <code>RGBA</code> instances.  You can apply colours to renderables directly or through syntax style maps for code‑like UIs.</p>
            <p>You can also specify transparency using the alpha component.  Colours blend with the terminal background to produce semi‑transparent effects.</p>
            <CodeBlock
              language="ts"
              code={`import { parseColor, TextRenderable } from "@cascadetui/core"
const accent = parseColor("#19b58f")
const warning = parseColor("orange")
new TextRenderable(renderer, {
  content: "Health check: OK",
  color: accent,
})`}
            />
            <p>You can define alpha values when constructing colours:</p>
            <CodeBlock
              language="ts"
              code={`import { RGBA } from "@cascadetui/core"
const semi = new RGBA(255, 0, 0, 0.5)`}
            />
            <p>Opacity is also supported as a renderable property, which makes it easy to build layered UIs.  If both parent and child define opacity, the effective value is multiplied.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable } from "@cascadetui/core"

const parent = new BoxRenderable(renderer, {
  width: 30,
  height: 8,
  border: true,
  backgroundColor: "#e94560",
  opacity: 0.7,
  padding: 1,
})

const child = new BoxRenderable(renderer, {
  width: "auto",
  height: 4,
  border: true,
  backgroundColor: "#0f3460",
  opacity: 0.5,
  alignItems: "center",
  justifyContent: "center",
})

child.add(new TextRenderable(renderer, { content: "Effective opacity: 0.35" }))
parent.add(child)
renderer.root.add(parent)`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "lifecycle",
    group: "Core Concepts",
    title: "Lifecycle",
    subtitle: "Starting, pausing, resuming and cleaning up.",
    sections: [
      {
        id: "about-lifecycle",
        title: "Lifecycle",
        searchText: "lifecycle start pause resume destroy onDestroy signals cleanup",
        content: (
          <>
            <p>The renderer’s lifecycle methods make startup, suspension and teardown deterministic.  Always call <code>destroy</code> when your application exits to release resources and restore the terminal state.  You can customise which signals cause destruction and disable automatic Ctrl+C handling.</p>
            <p>Use <code>start</code> to begin the render loop, <code>pause</code> to suspend it temporarily (for example during heavy computation) and <code>resume</code> to continue.  Provide an <code>onDestroy</code> callback to clean up application‑specific resources when the renderer exits.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer()
renderer.start()
process.on("uncaughtException", (err) => {
  console.error(err)
  renderer.destroy()
})
renderer.onDestroy(() => {
  console.log("Clean up")
})
setTimeout(() => renderer.destroy(), 1000)`}
            />
            <p>It’s common to treat <code>destroy</code> as the single “shutdown hook” for your app: close files, stop timers, and flush logs there.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "selection",
    group: "Core Concepts",
    title: "Selection",
    subtitle: "Selecting text by character, word or line.",
    sections: [
      {
        id: "about-selection",
        title: "Selection",
        searchText: "selection selectWord selectLine clickCount character word line mouse double click triple click",
        content: (
          <>
            <p>Cascade supports interactive text selection.  When the user clicks within a text renderable, the selection granularity is determined by the click count: a single click selects a character, a double click selects the word under the cursor, and a triple click selects the entire line.  Dragging extends the selection across characters or lines.</p>
            <p>You can respond to selection events on the renderer.  For example, listen for mouse events and call <code>selectWord</code> or <code>selectLine</code> manually based on the click count.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("mouse", (event) => {
  if (event.clickCount === 2) {
    renderer.selectWord(event.x, event.y)
  }
  if (event.clickCount === 3) {
    renderer.selectLine(event.x, event.y)
  }
})`}
            />
            <p>Selections can be copied to the clipboard via your terminal emulator’s standard shortcuts.</p>
            <p>Selection is especially useful for log viewers and diff panes.  A common UX improvement is to also provide a “copy selected” action that prints the current selection to the built-in console, which makes it visible even when the host terminal clipboard integration is limited.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "text",
    group: "Components",
    title: "Text",
    subtitle: "Readable output and inline styling.",
    sections: [
      {
        id: "about-text",
        title: "Text",
        searchText: "text renderable bold italic underline color content span inline styles",
        content: (
          <>
            <p>The <code>Text</code> component displays plain or styled strings.  It is the base primitive for readable output and supports properties like <code>color</code>, <code>bold</code>, <code>italic</code> and <code>underline</code>.</p>
            <CodeBlock language="tsx" code={`<text content="Hello Cascade" color="#0a8e6f" bold />`} />
            <p>You can embed inline spans for rich styling by passing an array of segments.  Each segment can have its own properties.</p>
            <CodeBlock language="tsx" code={`<text content={[{ text: "Error: ", color: "red", bold: true }, { text: "file not found", italic: true }]} />`} />
            <p>For log-like output, prefer short lines and keep heavy formatting (bold/underline) for status tags.  This tends to remain readable across terminal themes.</p>
            <CodeBlock
              language="tsx"
              code={`<text
  content={[
    { text: "[0012] ", color: "#565f89" },
    { text: "INFO ", color: "#9ece6a", bold: true },
    { text: "Connected to server", color: "#c0caf5" },
  ]}
/>`}
            />
          </>
        ),
      },
      {
        id: "text-props",
        title: "Props",
        searchText: "text props content color fg bg bold italic underline dim strike wrap",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Common usage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="content">content</code></td>
                    <td><code className="doc-pill" title="string | segments">string | segments</code></td>
                    <td>Plain string, or an array of styled segments for rich text.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="color">color</code></td>
                    <td><code className="doc-pill" title="ColorInput">ColorInput</code></td>
                    <td>Foreground/text color (hex, named color, RGBA, etc.).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="bold">bold</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Use sparingly for labels and status tags.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="italic">italic</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Good for hints and secondary metadata.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="underline">underline</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Useful for links or active items (don’t overuse).</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Tip: when building “status lines”, prefer a fixed palette (e.g. gray timestamp + colored tag + message). This scales well for logs and diagnostics.</p>
          </>
        ),
      },
      {
        id: "text-recipes",
        title: "Recipes",
        searchText: "text recipes truncation ellipsis status bar inline spans",
        content: (
          <>
            <p>Recipe: status bar with left/right alignment (place text nodes inside a flex row container).</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" justifyContent="space-between" height={1} width="100%">
  <text content={"Connected"} color="#9ece6a" />
  <text content={"Ctrl+C to quit"} color="#565f89" />
</box>`}
            />
            <p>Recipe: inline emphasis using children (React/Solid bindings).</p>
            <CodeBlock
              language="tsx"
              code={`<text>
  <span fg="#7aa2f7">blue</span>
  <span> and </span>
  <strong>bold</strong>
  <span> text</span>
</text>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "box",
    group: "Components",
    title: "Box",
    subtitle: "Structural container with borders and spacing.",
    sections: [
      {
        id: "about-box",
        title: "Box",
        searchText: "box border padding flex container layout width height",
        content: (
          <>
            <p>Box creates structure for your UI.  It can draw optional borders, apply padding and act as a flex container for nested content.</p>
            <CodeBlock language="tsx" code={`<box border padding={1} width={32}>
  <text content="Settings" />
</box>`} />
            <p>You can control the layout direction and alignment inside a box using flex properties.  Below is a row that evenly distributes its children.</p>
            <CodeBlock language="tsx" code={`<box flexDirection="row" justifyContent="space-between" width="100%">
  <box border padding={1}>
    <text content="Left" />
  </box>
  <box border padding={1}>
    <text content="Right" />
  </box>
</box>`} />
            <p>Boxes can also be used as overlays with absolute positioning.  This is useful for toast notifications, modals, or floating help panels.</p>
            <CodeBlock
              language="tsx"
              code={`<box width="100%" height="100%">
  <box
    position="absolute"
    right={1}
    top={1}
    border
    padding={1}
    backgroundColor="#24283b"
  >
    <text content="Press ? for help" />
  </box>
</box>`}
            />
          </>
        ),
      },
      {
        id: "box-props",
        title: "Props",
        searchText: "box props border padding margin flexDirection alignItems justifyContent position zIndex width height",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="border">border</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Draw a border around the box. Great for panels and grouping.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="padding">padding</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Add inner space between the border and children.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="flexDirection">flexDirection</code></td>
                    <td><code className="doc-pill" title="row | column">row | column</code></td>
                    <td>Layout children horizontally or vertically.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="flexGrow">flexGrow</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Use <code>1</code> to fill remaining space (typical for main panels).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="position">position</code></td>
                    <td><code className="doc-pill" title="relative | absolute">relative | absolute</code></td>
                    <td>Use absolute for overlays (toasts, modals, tooltips).</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Tip: keep a consistent “app shell” structure (header/body/footer) and only swap main content. This reduces layout churn and focus bugs.</p>
          </>
        ),
      },
      {
        id: "box-recipes",
        title: "Recipes",
        searchText: "box recipes modal overlay zIndex centered",
        content: (
          <>
            <p>Recipe: centered modal overlay (use absolute positioning + a dim backdrop).</p>
            <CodeBlock
              language="tsx"
              code={`<box width="100%" height="100%">
  <box position="absolute" width="100%" height="100%" backgroundColor="#000000" opacity={0.4} />
  <box
    position="absolute"
    border
    padding={1}
    width={50}
    height={8}
    left={10}
    top={5}
    backgroundColor="#1f2335"
  >
    <text content="Confirm?" bold />
  </box>
</box>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "input",
    group: "Components",
    title: "Input",
    subtitle: "Single‑line user input.",
    sections: [
      {
        id: "about-input",
        title: "Input",
        searchText: "input placeholder onInput onSubmit focused single line keyboard submit",
        content: (
          <>
            <p>The <code>Input</code> component allows users to enter a single line of text.  Provide a <code>placeholder</code> string and handlers for <code>onInput</code> and <code>onSubmit</code> to respond to changes and submissions.</p>
            <CodeBlock
              language="tsx"
              code={`<input
  placeholder="Search package"
  focused
  onInput={(value) => setQuery(value)}
  onSubmit={(value) => runSearch(value)}
/>`}
            />
            <p>Disable editing by omitting the handler or set a value property to implement controlled inputs.</p>
            <CodeBlock
              language="tsx"
              code={`<input value={username()} onSubmit={(name) => save(name)} disabled={isLoading()} />`}
            />
            <p>A common UX pattern is “submit clears input”.  Keep the input controlled and update its value inside <code>onSubmit</code> after you process the data.</p>
            <CodeBlock
              language="tsx"
              code={`<input
  value={draft()}
  placeholder="Type a command"
  onInput={(next) => setDraft(next)}
  onSubmit={(value) => {
    runCommand(value)
    setDraft("")
  }}
/>`}
            />
          </>
        ),
      },
      {
        id: "input-props",
        title: "Props",
        searchText: "input props value placeholder focused disabled onInput onSubmit onKey",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="value">value</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Controlled input value (recommended for predictable behavior).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="placeholder">placeholder</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Hint text when empty.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="focused">focused</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Requests focus on mount (use carefully in multi-widget UIs).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onInput">onInput</code></td>
                    <td><code className="doc-pill" title="(value) => void">(value) =&gt; void</code></td>
                    <td>Called on each edit; update state/store here.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onSubmit">onSubmit</code></td>
                    <td><code className="doc-pill" title="(value) => void">(value) =&gt; void</code></td>
                    <td>Called on Enter/Return; good for commands/search.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "input-recipes",
        title: "Recipes",
        searchText: "input recipes command prompt history esc",
        content: (
          <>
            <p>Recipe: “command prompt” input with Esc to clear and Enter to submit.</p>
            <CodeBlock
              language="tsx"
              code={`<input
  value={draft()}
  placeholder=":type a command"
  focused
  onInput={setDraft}
  onKey={(e) => {
    if (e.name === "escape") setDraft("")
  }}
  onSubmit={(value) => {
    runCommand(value)
    setDraft("")
  }}
/>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "textarea",
    group: "Components",
    title: "Textarea",
    subtitle: "Multiline editing, navigation and selection.",
    sections: [
      {
        id: "about-textarea",
        title: "Textarea",
        searchText: "textarea multiline editing selection undo redo highlights",
        content: (
          <>
            <p>Textarea supports multiple lines of text and provides navigation, selection and undo/redo capabilities.  Bind it to a reactive signal for two‑way editing.</p>
            <CodeBlock
              language="tsx"
              code={`<textarea
  value={content()}
  onInput={(next) => setContent(next)}
  width="100%"
  height={12}
/>`}
            />
            <p>You can highlight specific ranges programmatically, for example to indicate syntax errors.</p>
            <CodeBlock
              language="tsx"
              code={`<textarea
  value={code()}
  highlights={[{ start: 10, end: 20, color: "yellow" }]}
  onInput={(next) => setCode(next)}
/>`}
            />
            <p>Textarea is also a good foundation for simple editors: pair it with a status bar, line numbers, and a help footer.  For complex use cases (syntax highlighting, diffs), combine it with Code and Tree‑sitter.</p>
          </>
        ),
      },
      {
        id: "textarea-props",
        title: "Props",
        searchText: "textarea props value onInput width height highlights focused",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="value">value</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Controlled content; keep it in state/store.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onInput">onInput</code></td>
                    <td><code className="doc-pill" title="(value) => void">(value) =&gt; void</code></td>
                    <td>Called when the user edits the text.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="width">width</code></td>
                    <td><code className="doc-pill" title="number | %">number | %</code></td>
                    <td>Set to <code>"100%"</code> for editor-like panels.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="height">height</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Pick a fixed height or put it in a flex container.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="highlights">highlights</code></td>
                    <td><code className="doc-pill" title="ranges">ranges</code></td>
                    <td>Highlight ranges (e.g. errors, search matches).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "select",
    group: "Components",
    title: "Select",
    subtitle: "Vertical option lists with keyboard navigation.",
    sections: [
      {
        id: "about-select",
        title: "Select",
        searchText: "select options selectedIndex onSelect keyboard navigation",
        content: (
          <>
            <p>Select provides a scrollable list of options.  Users can navigate with arrow keys and choose an option.  The <code>selectedIndex</code> and <code>onSelect</code> props control selection.</p>
            <CodeBlock
              language="tsx"
              code={`<select
  options={["TypeScript", "Rust", "Zig"]}
  selectedIndex={0}
  onSelect={(index) => setLanguage(index)}
/>`}
            />
            <p>Populate options from an array of strings or objects.  You can also disable items by providing a boolean flag.</p>
            <CodeBlock
              language="tsx"
              code={`<select
  options={[
    { label: "Small", disabled: true },
    { label: "Medium" },
    { label: "Large" },
  ]}
  selectedIndex={1}
  onSelect={(i) => setSize(i)}
/>`}
            />
            <p>For large option sets, pair Select with Input: let users filter the list with a query and keep <code>selectedIndex</code> stable as results change.</p>
          </>
        ),
      },
      {
        id: "select-props",
        title: "Props",
        searchText: "select props options selectedIndex focused onChange onSelect showScrollIndicator disabled",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="options">options</code></td>
                    <td><code className="doc-pill" title="array">array</code></td>
                    <td>List of options (strings or objects). Provide stable values/labels for predictable UX.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="selectedIndex">selectedIndex</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Controlled selection index. Keep it stable when filtering.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="focused">focused</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Requests focus on mount (React/Solid).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onChange">onChange</code></td>
                    <td><code className="doc-pill" title="(index, option) => void">(index, option) =&gt; void</code></td>
                    <td>Fires when highlight changes (useful for preview panes).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onSelect">onSelect</code></td>
                    <td><code className="doc-pill" title="(index, option) => void">(index, option) =&gt; void</code></td>
                    <td>Fires on confirmation (Enter/click).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="showScrollIndicator">showScrollIndicator</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Show “more above/below” indicator for long lists.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "select-recipes",
        title: "Recipes",
        searchText: "select recipes master detail preview filter input",
        content: (
          <>
            <p>Recipe: master/detail browser (Select + preview panel). Use <code>onChange</code> to preview and <code>onSelect</code> to confirm.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" height="100%">
  <box width={26} border padding={1}>
    <text content="Items" bold />
    <select
      focused
      options={items()}
      selectedIndex={active()}
      onChange={(i) => setActive(i)}
      onSelect={(i) => open(items()[i])}
      showScrollIndicator
    />
  </box>
  <box flexGrow={1} border padding={1} marginLeft={1}>
    <text content={previewFor(items()[active()])} />
  </box>
</box>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "tab-select",
    group: "Components",
    title: "TabSelect",
    subtitle: "Compact tabs for mode switching.",
    sections: [
      {
        id: "about-tab-select",
        title: "TabSelect",
        searchText: "tab select tabs compact navigation workspace switch onChange",
        content: (
          <>
            <p>TabSelect is useful for switching between modes or workspaces.  It renders a horizontal row of tabs and calls <code>onChange</code> when the selected index changes.</p>
            <CodeBlock
              language="tsx"
              code={`<tab_select
  tabs={["Editor", "Diff", "Console"]}
  selectedIndex={activeTab()}
  onChange={(index) => setActiveTab(index)}
/>`}
            />
            <p>You can customize tab styles via props and disable individual tabs by setting a disabled flag.</p>
            <CodeBlock
              language="tsx"
              code={`<tab_select
  tabs={[
    { label: "Home" },
    { label: "Settings", disabled: true },
  ]}
  selectedIndex={0}
  onChange={(i) => setTab(i)}
/>`}
            />
            <p>Tabs work best when they represent persistent “areas” of the UI (not transient actions).  If you need transient actions, consider a menu or command palette instead.</p>
          </>
        ),
      },
      {
        id: "tab-select-props",
        title: "Props",
        searchText: "tabselect props tabs selectedIndex focused onChange onSelect",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="tabs">tabs</code></td>
                    <td><code className="doc-pill" title="array">array</code></td>
                    <td>Tab labels/options. Keep them short (terminal width).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="selectedIndex">selectedIndex</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Controlled active tab index.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="focused">focused</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Requests focus on mount (React/Solid).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onChange">onChange</code></td>
                    <td><code className="doc-pill" title="(index, tab) => void">(index, tab) =&gt; void</code></td>
                    <td>Fires when active tab changes (arrow keys / click).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onSelect">onSelect</code></td>
                    <td><code className="doc-pill" title="(index, tab) => void">(index, tab) =&gt; void</code></td>
                    <td>Fires on confirmation (if supported by the binding).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "scroll-box",
    group: "Components",
    title: "ScrollBox",
    subtitle: "Viewport clipping and virtualized scrolling.",
    sections: [
      {
        id: "about-scroll-box",
        title: "ScrollBox",
        searchText: "scrollbox virtual scrolling viewport clip content mouse wheel",
        content: (
          <>
            <p>ScrollBox clips its children to the viewport and enables vertical or horizontal scrolling.  It is ideal for long logs or lists.  You can scroll with the mouse wheel or via keyboard shortcuts.</p>
            <CodeBlock
              language="tsx"
              code={`<scrollbox height={10} border>
  <text content={longLogOutput()} />
</scrollbox>`}
            />
            <p>When the content is larger than the viewport, ScrollBox can maintain separate vertical and horizontal offsets.  This is especially helpful for long lines (logs, tables, diffs) where horizontal scrolling is needed.</p>
            <p>Attach a ScrollBar component to provide visual feedback for the current viewport:</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row">
  <scrollbox id="content" width={70} height={18} />
  <scrollbar targetId="content" />
</box>`}
            />
            <p>In imperative code, ScrollBox is typically used as a container renderable: add children over time, and optionally focus it to route wheel and key events.</p>
            <CodeBlock
              language="ts"
              code={`// Pseudocode-style example
scrollBox.focus()

for (let i = 0; i < 100; i += 1) {
  const row = new BoxRenderable(renderer, { padding: 1, marginBottom: 1 })
  row.add(new TextRenderable(renderer, { content: \`Row \${i}\` }))
  scrollBox.add(row)
}`}
            />
          </>
        ),
      },
      {
        id: "scroll-box-props",
        title: "Props",
        searchText: "scrollbox props id height width focused border scroll offsets",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="id">id</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Needed if you attach a <code>ScrollBar</code> via <code>targetId</code>.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="focused">focused</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Routes wheel/keyboard interactions to the scrollbox.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="height">height</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Typical: fixed viewport height (logs, code view).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="border">border</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Convenient for “pane” visuals.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "scroll-box-recipes",
        title: "Recipes",
        searchText: "scrollbox recipes log viewer follow tail auto scroll",
        content: (
          <>
            <p>Recipe: log viewer pane. Put a long <code>Text</code> or <code>Markdown</code> node inside a ScrollBox and attach a ScrollBar for feedback.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" height={18}>
  <scrollbox id="logs" flexGrow={1} border focused>
    <text content={logs()} />
  </scrollbox>
  <scrollbar targetId="logs" />
</box>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "scroll-bar",
    group: "Components",
    title: "ScrollBar",
    subtitle: "Visual indicator for scroll position.",
    sections: [
      {
        id: "about-scroll-bar",
        title: "ScrollBar",
        searchText: "scrollbar indicator thumb track attach scrollbox",
        content: (
          <>
            <p>ScrollBar displays a track and a movable thumb that reflects the visible region of an associated ScrollBox.  Provide the <code>targetId</code> of the ScrollBox to attach it.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row">
  <scrollbox id="content" width={70} height={18} />
  <scrollbar targetId="content" />
</box>`}
            />
            <p>You can place scrollbars vertically or horizontally and adjust their appearance via theme configuration.</p>
            <p>For large, high‑frequency content (like streaming logs), prefer keeping the ScrollBar visible and implement an “auto-follow” mode: when the user scrolls up manually, stop following; when they scroll back to the bottom, resume following.  This avoids fighting the user while still being great for tails.</p>
          </>
        ),
      },
      {
        id: "scroll-bar-props",
        title: "Props",
        searchText: "scrollbar props targetId orientation showArrows track thumb",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="targetId">targetId</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>ID of the ScrollBox to track. Must match exactly.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="orientation">orientation</code></td>
                    <td><code className="doc-pill" title="vertical | horizontal">vertical | horizontal</code></td>
                    <td>Choose vertical for lists/logs, horizontal for long lines/tables.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "slider",
    group: "Components",
    title: "Slider",
    subtitle: "Continuous numeric ranges via pointer or keyboard.",
    sections: [
      {
        id: "about-slider",
        title: "Slider",
        searchText: "slider value min max step drag keyboard precision onChange",
        content: (
          <>
            <p>Slider maps pointer and keyboard interaction to a continuous numeric range.  Set <code>min</code>, <code>max</code>, and an initial <code>value</code>.  The <code>onChange</code> callback receives updates as the thumb moves.</p>
            <CodeBlock
              language="tsx"
              code={`<slider min={0} max={100} value={volume()} onChange={(next) => setVolume(next)} />`}
            />
            <p>Use the <code>step</code> prop to snap values to discrete increments and specify orientation (vertical or horizontal) via <code>orientation</code>.</p>
            <CodeBlock
              language="tsx"
              code={`<slider min={0} max={1} value={gain()} step={0.1} orientation="vertical" onChange={(n) => setGain(n)} />`}
            />
            <p>Sliders work well as “live controls” in dashboards.  Pair them with a readout and keep the slider focused so arrow keys adjust it in small increments, while PageUp/PageDown can apply larger jumps.</p>
          </>
        ),
      },
      {
        id: "slider-props",
        title: "Props",
        searchText: "slider props min max value step orientation focused onChange",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="min">min</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Lower bound (inclusive).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="max">max</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Upper bound (inclusive).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="value">value</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Controlled value. Keep it in state/store.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="step">step</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Snaps to increments (useful for gain/volume, percentages).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="onChange">onChange</code></td>
                    <td><code className="doc-pill" title="(value) => void">(value) =&gt; void</code></td>
                    <td>Called on drag/keyboard updates.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "code",
    group: "Components",
    title: "Code",
    subtitle: "Syntax‑aware source formatting.",
    sections: [
      {
        id: "about-code",
        title: "Code",
        searchText: "code renderable syntax highlighting language lineNumbers content",
        content: (
          <>
            <p>The <code>Code</code> renderable formats source content with syntax‑aware styling rules.  Specify a language, provide the source content and optionally enable line numbers.</p>
            <CodeBlock
              language="tsx"
              code={`<code
  language="typescript"
  content={source()}
  lineNumbers
/>`}
            />
            <p>Use Tree‑sitter integration to provide semantic styling for supported languages.  See the reference section on Tree‑sitter for details.</p>
            <p>Code is most effective when paired with ScrollBox: keep the code viewer clipped to a viewport and allow both vertical and horizontal scrolling.  This makes it viable for long files and wide diffs in a terminal.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row">
  <scrollbox id="code" width={80} height={20} border>
    <code language="typescript" content={source()} lineNumbers />
  </scrollbox>
  <scrollbar targetId="code" />
</box>`}
            />
          </>
        ),
      },
      {
        id: "code-props",
        title: "Props",
        searchText: "code props language content lineNumbers wrapMode theme tree-sitter",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="language">language</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Used for highlighting rules and (when enabled) Tree‑sitter parsing.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="content">content</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Source text to render.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="lineNumbers">lineNumbers</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Enable a gutter. Prefer this for editor/diff UIs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "markdown",
    group: "Components",
    title: "Markdown",
    subtitle: "Render Markdown documents with headings, lists and code fences.",
    sections: [
      {
        id: "about-markdown",
        title: "Markdown",
        searchText: "markdown renderable parser headings lists tables code fences",
        content: (
          <>
            <p>Markdown renderable supports headings, lists, tables and fenced code blocks.  Pass your markdown string to the <code>content</code> property.</p>
            <CodeBlock
              language="tsx"
              code={`<markdown
  content={"# Notes\n\n- keyboard\n- render loop\n\nCode sample:\nconst ok = true"}
/>`}
            />
            <p>You can disable parsing of specific features (such as tables) via props, or integrate with Tree‑sitter to highlight code fences.</p>
            <p>For docs-style UIs, put Markdown inside a ScrollBox and add a persistent header/footer around it.  This gives you a “reader mode” experience for long documents.</p>
            <CodeBlock
              language="tsx"
              code={`<scrollbox height={18} border>
  <markdown
    content={
      "# Getting started\\n\\n" +
      "## Commands\\n\\n" +
      "- **Enter**: submit\\n- **Esc**: cancel\\n\\n" +
      "## Example\\n\\n" +
      "~~~ts\\n" +
      "const value = 42\\n" +
      "console.log(value)\\n" +
      "~~~\\n"
    }
  />
</scrollbox>`}
            />
          </>
        ),
      },
      {
        id: "markdown-props",
        title: "Props",
        searchText: "markdown props content enableTables code fences tree-sitter",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="content">content</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Markdown source.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "line-numbers",
    group: "Components",
    title: "Line numbers",
    subtitle: "Gutters and line metadata for code content.",
    sections: [
      {
        id: "about-line-numbers",
        title: "Line numbers",
        searchText: "line numbers renderable diagnostics gutters wrapped lines highlighted",
        content: (
          <>
            <p>The LineNumberRenderable adds gutters and aligns line metadata with code or text.  Enable line numbers on a Code renderable or use it standalone to display diagnostics alongside plain text.</p>
            <CodeBlock
              language="tsx"
              code={`<line_number
  content={source()}
  lineNumbers
  highlightedLines={[3, 7, 11]}
/>`}
            />
            <p>Highlight specific lines by passing an array of line indices.  You can combine this with diff or diagnostic renderables for rich editors.</p>
          </>
        ),
      },
      {
        id: "line-numbers-props",
        title: "Props",
        searchText: "line numbers props content lineNumbers highlightedLines diagnostics",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="content">content</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td>Text/code whose lines are numbered.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="lineNumbers">lineNumbers</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td>Enable the gutter itself.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="highlightedLines">highlightedLines</code></td>
                    <td><code className="doc-pill" title="number[]">number[]</code></td>
                    <td>Line indexes to highlight (breakpoints/errors/active line).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "frame-buffer",
    group: "Components",
    title: "FrameBuffer",
    subtitle: "Offscreen composition and reusable snapshots.",
    sections: [
      {
        id: "about-frame-buffer",
        title: "FrameBuffer",
        searchText: "frame buffer offscreen rendering compositing reuse snapshot",
        content: (
          <>
            <p>FrameBuffer enables offscreen rendering patterns.  It allows you to render content into an offscreen buffer and then draw it onto the main screen.  This is useful for complex animations or caching expensive layouts.</p>
            <CodeBlock
              language="ts"
              code={`import { FrameBufferRenderable } from "@cascadetui/core"
const fb = new FrameBufferRenderable(renderer, { width: 40, height: 10 })
renderer.root.add(fb)`}
            />
            <p>You can capture a snapshot of a complex component, then reuse it multiple times in different locations without re‑rendering it each frame.</p>
          </>
        ),
      },
      {
        id: "frame-buffer-props",
        title: "Props",
        searchText: "framebuffer props width height reuse snapshot respectAlpha",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="width">width</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Buffer width in cells.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="height">height</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td>Buffer height in cells.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: "ascii-font",
    group: "Components",
    title: "ASCIIFont",
    subtitle: "Large banner text for headers and splash screens.",
    sections: [
      {
        id: "overview",
        title: "ASCIIFont",
        searchText: "ascii font renderable large text headings banners style title header decorative",
        content: (
          <>
            <p>Render large decorative text using ASCII art fonts. ASCIIFont is implemented as a FrameBuffer-backed renderable: the text is rendered into an offscreen buffer and then composed into the main tree.</p>
            <p>Use it for splash screens, section headers, welcome banners, and compact “branding” elements in a terminal UI. For dense UIs, prefer plain <code>Text</code> and reserve ASCIIFont for high-impact moments.</p>
          </>
        ),
      },
      {
        id: "basic-usage",
        title: "Basic Usage",
        searchText: "ascii font basic usage renderable api construct api",
        content: (
          <>
            <p>Renderable API</p>
            <CodeBlock
              language="ts"
              code={`import { ASCIIFontRenderable, RGBA, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer()

const title = new ASCIIFontRenderable(renderer, {
  id: "title",
  text: "CASCADE",
  font: "tiny",
  color: RGBA.fromInts(255, 255, 255, 255),
})

renderer.root.add(title)`}
            />

            <p>Construct API</p>
            <CodeBlock
              language="ts"
              code={`import { ASCIIFont, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer()

renderer.root.add(
  ASCIIFont({
    text: "HELLO",
    font: "block",
    color: "#00FF00",
  }),
)`}
            />
            <p>React binding</p>
            <CodeBlock
              language="tsx"
              code={`import { createCliRenderer, type ASCIIFontName } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"
import { useState } from "react"

function App() {
  const [font, setFont] = useState<ASCIIFontName>("tiny")
  return (
    <box style={{ paddingLeft: 1, paddingRight: 1 }}>
      <select
        focused
        onChange={(_, option) => setFont(option?.value)}
        options={[
          { name: "Tiny", value: "tiny" },
          { name: "Block", value: "block" },
          { name: "Shade", value: "shade" },
          { name: "Slick", value: "slick" },
          { name: "Huge", value: "huge" },
          { name: "Grid", value: "grid" },
          { name: "Pallet", value: "pallet" },
        ]}
      />

      <ascii-font text="ASCII" font={font} color="#7aa2f7" />
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)`}
            />
          </>
        ),
      },
      {
        id: "available-fonts",
        title: "Available Fonts",
        searchText: "ascii font available fonts tiny block shade slick huge grid pallet",
        content: (
          <>
            <p>Cascade includes several ASCII art font styles:</p>
            <CodeBlock
              language="ts"
              code={`// Small, compact font
{
  font: "tiny",
}

// Block style font
{
  font: "block",
}

// Shaded style font
{
  font: "shade",
}

// Slick style font
{
  font: "slick",
}

// Large font
{
  font: "huge",
}

// Grid style font
{
  font: "grid",
}

// Pallet style font
{
  font: "pallet",
}`}
            />
            <p>In practice, start with <code>tiny</code> for compact UIs and <code>block</code> for hero headers. Use larger fonts sparingly so they don’t dominate the layout.</p>
          </>
        ),
      },
      {
        id: "schema",
        title: "Schema (ASCIIFontOptions)",
        searchText: "ascii font schema ASCIIFontOptions defaults width height frame buffer selection",
        content: (
          <>
            <p>ASCIIFont is backed by <code>ASCIIFontRenderable</code> and accepts <code>ASCIIFontOptions</code>. Width/height are computed from the rendered text and font and are not configurable directly.</p>
            <CodeBlock
              language="ts"
              code={`export interface ASCIIFontOptions extends Omit<RenderableOptions<ASCIIFontRenderable>, "width" | "height"> {
  text?: string
  font?: ASCIIFontName
  color?: ColorInput | ColorInput[]
  backgroundColor?: ColorInput
  selectionBg?: ColorInput
  selectionFg?: ColorInput
  selectable?: boolean
}

// Defaults
{
  text: "",
  font: "tiny",
  color: "#FFFFFF",
  backgroundColor: "transparent",
  selectionBg: undefined,
  selectionFg: undefined,
  selectable: true,
}`}
            />
            <p>Because dimensions depend on <code>text</code> and <code>font</code>, changing either triggers a re-measure and a re-render. If you rely on layout constraints (flex), treat ASCIIFont as a fixed-size child (it sets <code>flexShrink: 0</code> internally).</p>
          </>
        ),
      },
      {
        id: "positioning",
        title: "Positioning",
        searchText: "ascii font positioning x y offset",
        content: (
          <>
            <p>Position the ASCII text anywhere on screen:</p>
            <CodeBlock
              language="ts"
              code={`const title = new ASCIIFontRenderable(renderer, {
  id: "title",
  text: "TITLE",
  font: "block",
  color: RGBA.fromHex("#FFFF00"),
  x: 10,
  y: 2,
})`}
            />
            <p>If you are using flex layouts heavily, consider wrapping the ASCIIFont inside a container (Box) and let layout place it. Reserve explicit x/y positioning for overlays and splash screens.</p>
          </>
        ),
      },
      {
        id: "colors",
        title: "Colors and multi-color fonts",
        searchText: "ascii font colors ColorInput array multi-color font palette cfonts",
        content: (
          <>
            <p><code>color</code> accepts either a single <code>ColorInput</code> or an array of colors. The array form is used by multi-color font definitions (some fonts embed color segments). If the font uses multiple colors, the renderer will pick from the provided color array by index.</p>
            <CodeBlock
              language="ts"
              code={`import { ASCIIFont, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer()

renderer.root.add(
  ASCIIFont({
    text: "GRAD",
    font: "block",
    // Each segment in the font can refer to a different color index
    color: ["#7aa2f7", "#bb9af7", "#7dcfff", "#9ece6a"],
  }),
)`}
            />
            <p>If you just want a “gradient look” without relying on font segmentation, a common trick is layering two ASCIIFonts with small offsets (shadow) or splitting your text into two nodes.</p>
          </>
        ),
      },
      {
        id: "selection",
        title: "Selection",
        searchText: "ascii font selection selectable selectionBg selectionFg getSelectedText hasSelection",
        content: (
          <>
            <p>ASCIIFont supports mouse-driven selection (when selection is enabled at the renderer level). You can disable selection via <code>selectable: false</code> or style it via <code>selectionBg</code>/<code>selectionFg</code>.</p>
            <CodeBlock
              language="ts"
              code={`import { ASCIIFontRenderable, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer({ useMouse: true })

const banner = new ASCIIFontRenderable(renderer, {
  id: "banner",
  text: "SELECT ME",
  font: "block",
  selectionBg: "#33467a",
  selectionFg: "#c0caf5",
  selectable: true,
})

renderer.root.add(banner)

renderer.on("mouse", () => {
  if (banner.hasSelection()) {
    console.log("Selected:", banner.getSelectedText())
  }
})`}
            />
            <p>When layering multiple ASCIIFont nodes (e.g. shadows), consider setting <code>selectable: false</code> on decorative layers to avoid confusing selection behavior.</p>
          </>
        ),
      },
      {
        id: "properties",
        title: "Properties",
        searchText: "ascii font properties text font color background selectable selectionBg selectionFg x y",
        content: (
          <>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="text">text</code></td>
                    <td><code className="doc-pill" title="string">string</code></td>
                    <td><code className="doc-pill" title={'""'}>&quot;&quot;</code></td>
                    <td>Text to display</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="font">font</code></td>
                    <td><code className="doc-pill" title="ASCIIFontName">ASCIIFontName</code></td>
                    <td><code className="doc-pill" title={'"tiny"'}>&quot;tiny&quot;</code></td>
                    <td>Font style to use</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="color">color</code></td>
                    <td><code className="doc-pill" title="ColorInput | ColorInput[]">ColorInput | ColorInput[]</code></td>
                    <td><code className="doc-pill" title={'"#FFFFFF"'}>&quot;#FFFFFF&quot;</code></td>
                    <td>Text color(s)</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="backgroundColor">backgroundColor</code></td>
                    <td><code className="doc-pill" title="ColorInput">ColorInput</code></td>
                    <td><code className="doc-pill" title={'"transparent"'}>&quot;transparent&quot;</code></td>
                    <td>Background color</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="selectable">selectable</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="true">true</code></td>
                    <td>Whether text is selectable</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="selectionBg">selectionBg</code></td>
                    <td><code className="doc-pill" title="ColorInput">ColorInput</code></td>
                    <td><code className="doc-pill" title="-">-</code></td>
                    <td>Selection background color</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="selectionFg">selectionFg</code></td>
                    <td><code className="doc-pill" title="ColorInput">ColorInput</code></td>
                    <td><code className="doc-pill" title="-">-</code></td>
                    <td>Selection foreground color</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="x">x</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td><code className="doc-pill" title="-">-</code></td>
                    <td>X position offset</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="y">y</code></td>
                    <td><code className="doc-pill" title="number">number</code></td>
                    <td><code className="doc-pill" title="-">-</code></td>
                    <td>Y position offset</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Note: width and height are measured from <code>text</code> and <code>font</code>. If you need to “align” the banner visually, prefer putting it in a container and using layout props (<code>alignItems</code>, <code>justifyContent</code>) instead of forcing explicit sizes.</p>
          </>
        ),
      },
      {
        id: "welcome-screen",
        title: "Example: Welcome Screen",
        searchText: "ascii font welcome screen example box text createCliRenderer",
        content: (
          <>
            <CodeBlock
              language="ts"
              code={`import { Box, ASCIIFont, Text, createCliRenderer } from "@cascadetui/core"

const renderer = await createCliRenderer()

const welcomeScreen = Box(
  {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  ASCIIFont({
    text: "Cascade",
    font: "huge",
    color: "#00FFFF",
  }),
  Text({
    content: "Terminal UI Framework",
    fg: "#888888",
  }),
  Text({
    content: "Press any key to continue...",
    fg: "#444444",
  }),
)

renderer.root.add(welcomeScreen)`}
            />
          </>
        ),
      },
      {
        id: "dynamic-text",
        title: "Dynamic Text",
        searchText: "ascii font dynamic text update text property interval",
        content: (
          <>
            <p>Update the text content dynamically:</p>
            <CodeBlock
              language="ts"
              code={`const counter = new ASCIIFontRenderable(renderer, {
  id: "counter",
  text: "0",
  font: "block",
  color: RGBA.fromHex("#FF0000"),
})

let count = 0
setInterval(() => {
  count++
  counter.text = count.toString()
}, 1000)`}
            />
          </>
        ),
      },
      {
        id: "color-effects",
        title: "Color Effects",
        searchText: "ascii font color effects gradient shadow overlay",
        content: (
          <>
            <p>Create gradient-like effects by positioning multiple ASCII fonts:</p>
            <CodeBlock
              language="ts"
              code={`import { Box, ASCIIFont } from "@cascadetui/core"

const gradientTitle = Box(
  {},
  ASCIIFont({
    text: "HELLO",
    font: "block",
    color: "#FF0000",
  }),
  // Overlay with offset for shadow effect
  ASCIIFont({
    text: "HELLO",
    font: "block",
    color: "#880000",
    x: 1,
    y: 1,
    selectable: false,
  }),
)`}
            />
            <p>When layering, be mindful of selection behaviour (two overlapping selectable nodes) and consider disabling selection for the shadow layer.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "diff",
    group: "Components",
    title: "Diff",
    subtitle: "Visualising unified or split code differences.",
    sections: [
      {
        id: "about-diff",
        title: "Diff",
        searchText: "diff renderable unified split view git patches syntax wrapMode diff content",
        content: (
          <>
            <p>Diff renderable visualises patch content.  Display differences in unified or split mode and choose how to wrap long lines.  Provide the diff string via the <code>diff</code> prop.</p>
            <CodeBlock
              language="tsx"
              code={`<diff
  view="split"
  wrapMode="word"
  diff={patch()}
/>`}
            />
            <p>You can highlight intraline changes and configure colours for additions and deletions.</p>
            <p>A practical pattern is to pair Diff with a file list and keep the diff pane scrollable.  When the user selects a file, swap the diff content and reset scroll to top.  This turns Diff into a usable “mini code review” UI.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" height="100%">
  <box width={24} border padding={1}>
    <text content="Files" bold />
    <select options={files()} selectedIndex={activeFile()} onSelect={(i) => setActiveFile(i)} />
  </box>
  <scrollbox id="diff" flexGrow={1} border>
    <diff view="unified" wrapMode="none" diff={patchForActiveFile()} />
  </scrollbox>
  <scrollbar targetId="diff" />
</box>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "solid-render",
    group: "Bindings",
    title: "Solid.js Render entrypoint",
    subtitle: "Configure jsxImportSource and render your root component.",
    sections: [
      {
        id: "about-solid-render",
        title: "Render entrypoint",
        searchText: "solid render jsxImportSource preload bunfig createCliRenderer render root component",
        content: (
          <>
            <p>To use Cascade with Solid.js, configure your bundler to set <code>jsxImportSource</code> to <code>@cascadetui/solid</code> and preload the runtime if necessary.  Then call the <code>render</code> function to mount your root component into the terminal.</p>
            <CodeBlock
              language="tsx"
              code={`import { render } from "@cascadetui/solid"
import { createSignal } from "solid-js"

function App() {
  const [count, setCount] = createSignal(0)
  return <text content={'Count: ' + count()} onMouseDown={() => setCount((n) => n + 1)} />
}

await render(() => <App />)`}
            />
            <p>The Solid renderer shares the same event loop and lifetime as the core renderer, so you can use keyboard hooks and lifecycle methods as usual.</p>
            <p>As your app grows, treat your root component like a normal UI shell: header + main + footer.  Keep state at the lowest level that needs it, and pass callbacks down to child components.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "solid-hooks",
    group: "Bindings",
    title: "Solid.js Hooks",
    subtitle: "Keyboard shortcuts, renderer access and terminal dimensions.",
    sections: [
      {
        id: "about-solid-hooks",
        title: "Hooks and interaction",
        searchText: "solid hooks useKeyboard useRenderer useTerminalDimensions keyboard resize",
        content: (
          <>
            <p>Use Solid hooks to interact with the renderer and terminal state.  <code>useKeyboard</code> registers a callback for key events, <code>useRenderer</code> returns the active renderer instance and <code>useTerminalDimensions</code> provides reactive width and height values.</p>
            <CodeBlock
              language="ts"
              code={`useKeyboard((event) => {
  if (event.name === "escape") process.exit(0)
})`}
            />
            <p>Combine hooks to build dynamic behaviour.  For example, update a counter when the terminal is resized.</p>
            <CodeBlock
              language="tsx"
              code={`import { useTerminalDimensions } from "@cascadetui/solid"

function SizeIndicator() {
  const dims = useTerminalDimensions()
  return <text content={'Size: ' + dims().width + 'x' + dims().height} />
}`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "react-root",
    group: "Bindings",
    title: "React createRoot",
    subtitle: "Attach a React tree to the Cascade renderer.",
    sections: [
      {
        id: "about-react-root",
        title: "createRoot",
        searchText: "react createRoot renderer reconciler attach root mount",
        content: (
          <>
            <p>To use Cascade with React, first create a renderer and then call <code>createRoot(renderer).render(&lt;App /&gt;)</code>.  The React reconciler will translate your JSX tree into Cascade renderables and manage updates.</p>
            <CodeBlock
              language="tsx"
              code={`import { createCliRenderer } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)`}
            />
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>API</th>
                    <th>Signature</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="createRoot">createRoot</code></td>
                    <td><code className="doc-pill" title="(renderer: CliRenderer) => Root">(renderer: CliRenderer) =&gt; Root</code></td>
                    <td>Creates a React root bound to a specific Cascade renderer instance.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="Root.render">root.render</code></td>
                    <td><code className="doc-pill" title="(node: ReactNode) => void">(node: ReactNode) =&gt; void</code></td>
                    <td>Mounts (or updates) the React tree. Calling it again replaces the rendered tree.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="Root.unmount">root.unmount</code></td>
                    <td><code className="doc-pill" title="() => void">() =&gt; void</code></td>
                    <td>Unmounts the tree and frees React resources. Also triggered automatically on <code>renderer.destroy()</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>The returned root also exposes <code>unmount()</code>. The tree is automatically cleaned up when <code>renderer.destroy()</code> is called, but explicit unmount can be useful in tests or when embedding Cascade into a larger process.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer()
const root = createRoot(renderer)

root.render(<App />)

// Later
root.unmount()
renderer.destroy()`}
            />
            <p>Under the hood, the React binding attaches the animation engine to the renderer and wraps your app in an error boundary that forwards crashes to <code>renderer.reportCrash</code> (so you can inspect diagnostics in the console overlay).</p>
          </>
        ),
      },
      {
        id: "react-portals-and-sync",
        title: "Portals and synchronous flushing",
        searchText: "react createPortal flushSync portal overlay modal popover",
        content: (
          <>
            <p>The React binding also re-exports <code>createPortal</code> and <code>flushSync</code> from the internal reconciler integration. Use portals when you want to render a subtree into a different parent/container, and <code>flushSync</code> when you need a synchronous commit (usually only for edge cases).</p>
            <CodeBlock
              language="tsx"
              code={`import { createPortal, flushSync } from "@cascadetui/react"

// Example: force synchronous update (use sparingly)
flushSync(() => {
  // setState(...) etc
})

// Example: portals depend on your container/host integration
// (advanced usage; most apps do not need portals)`}
            />
            <p>In most applications you can ignore both. Prefer normal React composition and state updates.</p>
          </>
        ),
      },
      {
        id: "react-tsconfig",
        title: "TypeScript / JSX configuration",
        searchText: "react tsconfig jsxImportSource react-jsx typescript config",
        content: (
          <>
            <p>For best type inference and JSX tag support, set <code>jsxImportSource</code> to <code>@cascadetui/react</code> in your app <code>tsconfig.json</code>.</p>
            <CodeBlock
              language="json"
              code={`{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@cascadetui/react",
    "lib": ["ESNext", "DOM"],
    "moduleResolution": "bundler",
    "strict": true
  }
}`}
            />
            <p>If you don’t set <code>jsxImportSource</code>, you can still use the binding, but you may lose typing on intrinsic elements like <code>&lt;box /&gt;</code> and <code>&lt;text /&gt;</code>.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "react-crash",
    group: "Bindings",
    title: "React Crash propagation",
    subtitle: "Error boundaries and diagnostics reporting.",
    sections: [
      {
        id: "about-react-crash",
        title: "Crash propagation",
        searchText: "react crash boundary reportCrash componentStack diagnostics error boundaries",
        content: (
          <>
            <p>Runtime failures in React component trees can be captured and correlated with renderer diagnostics.  Use React error boundaries to catch exceptions and then call the renderer’s crash reporting facilities to inspect the component stack and logs.</p>
            <p>Wrap critical sections in an error boundary and, in the catch handler, invoke <code>renderer.reportCrash</code> with the error and component stack.  This records the failure and optionally displays it in the console overlay.</p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Option / Env</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Effect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="logCrashReportsToConsole">logCrashReportsToConsole</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="false">false</code></td>
                    <td>When enabled, detailed crash reports are printed (via <code>console.error</code>) as soon as a crash is reported.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="openConsoleOnError">openConsoleOnError</code></td>
                    <td><code className="doc-pill" title="boolean">boolean</code></td>
                    <td><code className="doc-pill" title="false">false</code></td>
                    <td>Automatically opens the console overlay when an error/crash is reported.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="CASCADE_LOG_CRASH_REPORTS">CASCADE_LOG_CRASH_REPORTS</code></td>
                    <td><code className="doc-pill" title="boolean env">boolean env</code></td>
                    <td><code className="doc-pill" title="0">0</code></td>
                    <td>Enables logging crash reports to console (useful in development / CI).</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <CodeBlock
              language="ts"
              code={`import { createCliRenderer } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"

const renderer = await createCliRenderer({
  useConsole: true,
  openConsoleOnError: true,
  logCrashReportsToConsole: true,
})

createRoot(renderer).render(<App />)`}
            />
            <p>Tip: in terminal UIs, stdout/stderr can be hidden by alternate screen mode. Keeping <code>useConsole</code> enabled during development makes crash debugging much easier.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "react-hooks",
    group: "Bindings",
    title: "React Hooks",
    subtitle: "Keyboard shortcuts, renderer context and terminal dimensions.",
    sections: [
      {
        id: "about-react-hooks",
        title: "Hooks",
        searchText: "react useKeyboard useRenderer useTerminalDimensions shortcuts",
        content: (
          <>
            <p>The React bindings expose hooks analogous to the Solid ones.  Use <code>useKeyboard</code> to register a key handler, <code>useRenderer</code> to access the current renderer and <code>useTerminalDimensions</code> to react to resize events.</p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Hook</th>
                    <th>Signature</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="useRenderer">useRenderer</code></td>
                    <td><code className="doc-pill" title="() => CliRenderer">() =&gt; CliRenderer</code></td>
                    <td>Returns the active renderer from context. Throws if used outside the Cascade React root.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useKeyboard">useKeyboard</code></td>
                    <td>
                      <code className="doc-pill" title="(handler, options?) => void">
                        {"(handler: (e: KeyEvent) => void, options?: { release?: boolean }) => void"}
                      </code>
                    </td>
                    <td>Subscribes to keyboard events. By default receives press events (including repeats). Use <code>release: true</code> to also receive release events.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useTerminalDimensions">useTerminalDimensions</code></td>
                    <td>
                      <code className="doc-pill" title="() => {width,height}">{"() => { width: number; height: number }"}</code>
                    </td>
                    <td>Returns terminal width/height and re-renders on resize.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="useTimeline">useTimeline</code></td>
                    <td><code className="doc-pill" title="(options?) => Timeline">(options?: TimelineOptions) =&gt; Timeline</code></td>
                    <td>Creates a timeline and registers it with the animation engine; automatically pauses/unregisters on unmount.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <CodeBlock
              language="tsx"
              code={`import { useKeyboard } from "@cascadetui/react"

function App() {
  useKeyboard((event) => {
    if (event.name === "q") process.exit(0)
  })
  return <text content="Press q to quit" />
}`}
            />
            <p>Combine these hooks with standard React state and effect patterns to build interactive applications.</p>
            <CodeBlock
              language="tsx"
              code={`import { useTerminalDimensions } from "@cascadetui/react"

function App() {
  const dims = useTerminalDimensions()
  return <text content={"Size: " + dims.width + "x" + dims.height} />
}`}
            />
            <p>Recipe: track pressed keys (press + release)</p>
            <CodeBlock
              language="tsx"
              code={`import { useKeyboard } from "@cascadetui/react"
import { useMemo, useState } from "react"

function App() {
  const [pressed, setPressed] = useState<Set<string>>(() => new Set())

  useKeyboard(
    (e) => {
      setPressed((prev) => {
        const next = new Set(prev)
        if (e.eventType === "release") next.delete(e.name)
        else next.add(e.name)
        return next
      })
    },
    { release: true },
  )

  const text = useMemo(() => Array.from(pressed).sort().join(", ") || "(none)", [pressed])
  return <text>{"Pressed: " + text}</text>
}`}
            />
            <p>For animation, use <code>useTimeline</code> to register a timeline with the engine. A simple pattern is to update local state in <code>onUpdate</code> and let React re-render declaratively.</p>
            <CodeBlock
              language="tsx"
              code={`import { useTimeline } from "@cascadetui/react"
import { useEffect, useState } from "react"

function App() {
  const [progress, setProgress] = useState(0)
  const timeline = useTimeline({ duration: 1200, loop: true })

  useEffect(() => {
    timeline.add(
      { t: 0 },
      {
        t: 1,
        duration: 1200,
        ease: "linear",
        onUpdate: (a) => setProgress(a.targets[0].t),
      },
    )
  }, [])

  return (
    <box border padding={1} width={40}>
      <text>{"Loading: " + Math.round(progress * 100) + "%"}</text>
      <box style={{ width: Math.max(1, Math.round(progress * 36)), height: 1, backgroundColor: "#7aa2f7" }} />
    </box>
  )
}`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "create-cascade",
    group: "Tooling",
    title: "create-cascade",
    subtitle: "Scaffold a new Cascade project (core, react, solid) with starter templates.",
    sections: [
      {
        id: "create-cascade-overview",
        title: "Overview",
        searchText: "create-cascade bun create cascade scaffold generator core react solid starter",
        content: (
          <>
            <p><code>create-cascade</code> is the official project generator. It scaffolds a ready-to-run Cascade app with a chosen framework (core/React/Solid) and a starter preset.</p>
            <CodeBlock
              language="bash"
              code={`# Interactive mode
bun create cascade`}
            />
            <p>By default it only writes files. Use flags if you want the generator to install dependencies or start the dev server automatically.</p>
          </>
        ),
      },
      {
        id: "create-cascade-frameworks",
        title: "Frameworks and starters",
        searchText: "create-cascade frameworks starters minimal counter login layout input",
        content: (
          <>
            <p>Frameworks:</p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Framework</th>
                    <th>Use when…</th>
                    <th>Typical entry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="core">core</code></td>
                    <td>You prefer imperative renderables/constructs and direct control over nodes.</td>
                    <td><code className="doc-pill" title="createCliRenderer">createCliRenderer</code> + <code className="doc-pill" title="renderer.root.add">root.add</code></td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="react">react</code></td>
                    <td>You want React state/effects and declarative composition.</td>
                    <td><code className="doc-pill" title="createRoot">createRoot(renderer).render</code></td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="solid">solid</code></td>
                    <td>You want Solid signals + declarative composition.</td>
                    <td><code className="doc-pill" title="render">render(() =&gt; &lt;App /&gt;)</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Starters depend on the framework. For example, React includes <code>minimal</code>, <code>counter</code>, and <code>login</code>.</p>
            <CodeBlock
              language="bash"
              code={`# Create a React app with the counter starter
bun create cascade my-app -f react -s counter`}
            />
          </>
        ),
      },
      {
        id: "create-cascade-cli",
        title: "CLI options",
        searchText: "create-cascade cli options --framework --starter --here --install --start",
        content: (
          <>
            <CodeBlock
              language="text"
              code={`Options:
  -f, --framework <name>  Framework: core, react, solid
  -s, --starter <name>    Starter preset for selected framework
  --here                  Use current directory
  --install               Run bun install after scaffolding
  --start                 Run bun install, then bun run dev
  -h, --help              Show help`}
            />
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Flag</th>
                    <th>Behavior</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="--here">--here</code></td>
                    <td>Scaffold into the current directory.</td>
                    <td>Fails if the folder is not empty (to prevent overwriting).</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="--install">--install</code></td>
                    <td>Runs <code>bun install</code> after scaffolding.</td>
                    <td>Good for quick starts; skip if you want to inspect files first.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="--start">--start</code></td>
                    <td>Runs <code>bun install</code> then <code>bun run dev</code>.</td>
                    <td>Implied <code>--install</code>.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="-f/--framework">-f</code> / <code className="doc-pill" title="--framework">--framework</code></td>
                    <td>Selects the framework (<code>core</code>, <code>react</code>, <code>solid</code>).</td>
                    <td>Use in scripts to avoid interactive prompts.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="-s/--starter">-s</code> / <code className="doc-pill" title="--starter">--starter</code></td>
                    <td>Selects the starter preset for the chosen framework.</td>
                    <td>Pair it with <code>-f</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Tips:</p>
            <p>- If you’re scripting CI scaffolds, pass <code>-f</code> and <code>-s</code> explicitly to avoid interactive prompts.</p>
            <p>- Prefer <code>--install</code> over doing installs yourself when you want consistent generator behavior.</p>
          </>
        ),
      },
      {
        id: "create-cascade-behavior",
        title: "Behavior and workflow",
        searchText: "create-cascade behavior scaffold only install start workflow",
        content: (
          <>
            <p>The generator is intentionally conservative: it scaffolds files first and only installs/runs when you opt in. A typical workflow is:</p>
            <p>- Scaffold (interactive or scripted)</p>
            <p>- Run <code>bun install</code></p>
            <p>- Run <code>bun run dev</code></p>
            <p>If you’re building libraries or CI templates, prefer keeping scaffold and install separate for reproducibility.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "create-cascade-skill",
    group: "Tooling",
    title: "create-cascade-skill",
    subtitle: "Install CascadeTUI SKILL.md files for external coding agents.",
    sections: [
      {
        id: "create-cascade-skill-overview",
        title: "Overview",
        searchText: "create-cascade-skill skill SKILL.md agents codex cursor windsurf cline",
        content: (
          <>
            <p><code>create-cascade-skill</code> installs CascadeTUI skills for external coding agents using an interactive CLI. It detects supported agents on your machine and can install for one or many in a single run.</p>
            <CodeBlock
              language="bash"
              code={`npx create-cascade-skill`}
            />
            <p>The installer writes global <code>SKILL.md</code> files (with Agent Skills frontmatter) into the appropriate agent-specific directories.</p>
          </>
        ),
      },
      {
        id: "create-cascade-skill-supported",
        title: "Supported agents",
        searchText: "create-cascade-skill supported agents codex claude code cursor windsurf cline roo-code continue aider gemini-cli openhands goose ami",
        content: (
          <>
            <p>Supported agents include:</p>
            <p><code>Codex</code>, <code>Claude Code</code>, <code>Cursor</code>, <code>Windsurf</code>, <code>Cline</code>, <code>Roo Code</code>, <code>Continue</code>, <code>Aider</code>, <code>Gemini CLI</code>, <code>OpenHands</code>, <code>Goose</code>, <code>Ami</code>.</p>
            <p>Run with <code>--list</code> to see which agents are supported and which are detected on your machine.</p>
            <CodeBlock
              language="bash"
              code={`npx create-cascade-skill --list`}
            />
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>What it does</th>
                    <th>When to use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="doc-pill" title="interactive">interactive</code></td>
                    <td>Prompts you to select which agents to install for.</td>
                    <td>Best default; avoids remembering agent IDs.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="--agents">--agents</code></td>
                    <td>Installs for the specified agent IDs.</td>
                    <td>CI / scripting / repeatable setup.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="--all-detected">--all-detected</code></td>
                    <td>Installs for all agents detected on the machine.</td>
                    <td>Fast setup across multiple editors/agents.</td>
                  </tr>
                  <tr>
                    <td><code className="doc-pill" title="--dry-run">--dry-run</code></td>
                    <td>Shows what would be written without writing files.</td>
                    <td>Auditing changes before installing.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        id: "create-cascade-skill-cli",
        title: "CLI options",
        searchText: "create-cascade-skill cli options --agents --all-detected --list --dry-run --help",
        content: (
          <>
            <CodeBlock
              language="text"
              code={`Options:
  -a, --agents <ids>    Comma-separated agent IDs to install
  --all-detected        Install for all detected agents
  --list                Print supported and detected agents
  --dry-run             Preview files without writing
  -h, --help            Show help`}
            />
            <CodeBlock
              language="bash"
              code={`# Install for all detected agents
npx create-cascade-skill --all-detected

# Install for a specific agent
npx create-cascade-skill --agents cursor

# Preview what would be written
npx create-cascade-skill --agents cursor --dry-run`}
            />
            <p>Tip: the supported agent IDs are lowercase (e.g. <code>claude-code</code>). The UI labels may be displayed with spacing/case for readability.</p>
          </>
        ),
      },
      {
        id: "create-cascade-skill-files",
        title: "What gets installed",
        searchText: "create-cascade-skill installs SKILL.md files locations agent directories",
        content: (
          <>
            <p>The installer writes one or more <code>SKILL.md</code> files into agent-specific global skill directories (depending on the agent). These files contain “Agent Skills” frontmatter and instructions that help the agent use CascadeTUI effectively.</p>
            <p>If you maintain your own customized skills, run with <code>--dry-run</code> first and compare what would change.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "environment-variables",
    group: "Reference",
    title: "Environment variables",
    subtitle: "Operational flags for debugging and runtime behaviour.",
    sections: [
      {
        id: "about-environment-variables",
        title: "Environment variables",
        searchText: "environment variables CASCADE_LOG_CRASH_REPORTS CASCADE_SHOW_STATS CASCADE_DEBUG_FFI CASCADE_TREE_SITTER_WORKER_PATH",
        content: (
          <>
            <p>Cascade reads a number of environment variables to adjust diagnostics, FFI behaviour and Tree‑sitter integration.  Set these variables before launching your application to change its behaviour.</p>
            <CodeBlock
              language="bash"
              code={`CASCADE_LOG_CRASH_REPORTS=1 bun run app.ts
CASCADE_SHOW_STATS=1 bun run app.ts
CASCADE_DEBUG_FFI=1 bun run app.ts
CASCADE_TREE_SITTER_WORKER_PATH=./parser.worker.ts bun run app.ts`}
            />
            <p><code>CASCADE_LOG_CRASH_REPORTS</code> writes crash reports to the console.  <code>CASCADE_SHOW_STATS</code> prints frame timing and memory statistics.  <code>CASCADE_DEBUG_FFI</code> enables verbose logging for the Zig FFI layer.  <code>CASCADE_TREE_SITTER_WORKER_PATH</code> specifies the path to a custom Tree‑sitter worker script.</p>
            <p>When debugging production issues, start with <code>CASCADE_LOG_CRASH_REPORTS</code> and <code>CASCADE_SHOW_STATS</code>.  If you see rendering glitches or crashes around native calls, enable <code>CASCADE_DEBUG_FFI</code> to correlate the JS side with the Zig layer.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "tree-sitter",
    group: "Reference",
    title: "Tree‑sitter",
    subtitle: "Semantic syntax highlighting with parsers.",
    sections: [
      {
        id: "about-tree-sitter",
        title: "Tree‑sitter",
        searchText: "tree-sitter syntax highlighting parsers worker wasm markdown typescript zig add default parsers client initialize cache",
        content: (
          <>
            <p>Tree‑sitter enables semantic syntax highlighting in Cascade.  Use the <code>getTreeSitterClient</code> function to obtain a client instance and call <code>initialize()</code> to load parsers.  You can then pass the client to Code or Markdown renderables that support syntax‑aware styling.</p>
            <CodeBlock
              language="ts"
              code={`import { getTreeSitterClient } from "@cascadetui/core"

const client = getTreeSitterClient()
await client.initialize()`}
            />
            <p>To add parsers globally, import the language assets and register them.  You can also provide your own worker script by setting <code>CASCADE_TREE_SITTER_WORKER_PATH</code> in your environment.</p>
            <p>A typical workflow is: initialize once at startup, then reuse the same client for any Code/Markdown instances you create.  This keeps highlighting consistent and avoids repeated parser loading.</p>
            <p>If highlighting doesn’t appear, validate that the worker path is correct and that the environment variable is visible to your Bun process.  On Windows, prefer setting env vars inline per command (as shown above) or through your shell profile to avoid “invisible env” bugs.</p>
          </>
        ),
      },
    ],
  },
]

export function getPageById(id: string): DocPage | undefined {
  return docPages.find((page) => page.id === id)
}

export function getGroupedPages(): Record<string, DocPage[]> {
  return docPages.reduce<Record<string, DocPage[]>>((acc, page) => {
    acc[page.group] ??= []
    acc[page.group].push(page)
    return acc
  }, {})
}