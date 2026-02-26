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
      "Cascade is a native terminal UI runtime and component model, written in Zig with TypeScript APIs. This documentation covers architecture, renderables, framework bindings, and production reference details.",
    sections: [
      {
        id: "quick-start",
        title: "Quick start",
        searchText: "bun create cascade install scaffold quick start project",
        content: (
          <>
            <p>Start with Bun and scaffold a project that matches Cascade defaults.</p>
            <p>Then run your first interactive app directly in the terminal.</p>
            <CodeBlock language="bash" code={`bun create @cascadetui/create-cascade my-app\ncd my-app\nbun install\nbun run dev`} />
          </>
        ),
      },
      {
        id: "documentation-map",
        title: "Documentation map",
        searchText: "core concepts components bindings reference tree-sitter env vars",
        content: (
          <>
            <p>Core Concepts explains renderer internals, lifecycle, input, and layout primitives.</p>
            <p>Components documents each renderable with practical examples and expected behavior.</p>
            <p>Bindings covers React and Solid integration, while Reference centralizes env vars and Tree-sitter.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "core-api",
    group: "Core Concepts",
    title: "Core Concepts",
    subtitle: "Renderer model, renderable composition, keyboard and console behavior, and runtime lifecycle.",
    sections: [
      {
        id: "renderer",
        title: "Renderer",
        searchText: "createCliRenderer renderer root targetFps useMouse alternate screen",
        content: (
          <>
            <p>The renderer owns terminal IO, frame scheduling, input parsing, and root composition.</p>
            <p>Use configuration to tune FPS, mouse support, alternate screen mode, and crash reporting.</p>
            <CodeBlock
              language="ts"
              code={`import { createCliRenderer } from "@cascadetui/core"\n\nconst renderer = await createCliRenderer({\n  targetFps: 60,\n  useMouse: true,\n  useAlternateScreen: true,\n  logCrashReportsToConsole: true,\n})\n\nrenderer.root`} 
            />
          </>
        ),
      },
      {
        id: "renderables",
        title: "Renderables",
        searchText: "TextRenderable BoxRenderable InputRenderable add focus setters imperative",
        content: (
          <>
            <p>Renderables are concrete runtime instances attached to a renderer context.</p>
            <p>They expose direct methods and setters for imperative composition and mutation.</p>
            <CodeBlock
              language="ts"
              code={`import { BoxRenderable, TextRenderable } from "@cascadetui/core"\n\nconst panel = new BoxRenderable(renderer, {\n  width: 40,\n  border: true,\n  padding: 1,\n})\n\npanel.add(new TextRenderable(renderer, { content: "Runtime instance" }))\nrenderer.root.add(panel)`}
            />
          </>
        ),
      },
      {
        id: "constructs",
        title: "Constructs",
        searchText: "constructs vnode instantiate delegate Box Text Input declarative",
        content: (
          <>
            <p>Constructs create declarative VNode trees and instantiate renderables later.</p>
            <p>This enables composition-first APIs and delegated behavior such as forwarding focus.</p>
            <CodeBlock
              language="ts"
              code={`import { Box, Text, Input, instantiate, delegate } from "@cascadetui/core"\n\nconst form = delegate(\n  { focus: "username" },\n  Box(\n    { border: true, padding: 1 },\n    Text({ content: "Login" }),\n    Input({ id: "username", placeholder: "user" }),\n  ),\n)\n\nrenderer.root.add(instantiate(renderer, form))`}
            />
          </>
        ),
      },
      {
        id: "renderables-vs-constructs",
        title: "Renderables vs Constructs",
        searchText: "imperative declarative renderables vs constructs instantiate add mutation",
        content: (
          <>
            <p>Use renderables when you want explicit object control and direct runtime manipulation.</p>
            <p>Use constructs when you want reusable declarative factories and delayed instantiation.</p>
            <p>Both models are valid and can coexist in one app depending on the feature boundary.</p>
          </>
        ),
      },
      {
        id: "layout",
        title: "Layout",
        searchText: "layout flexDirection width height grow shrink padding absolute positioning",
        content: (
          <>
            <p>Cascade layout is box-based and supports flex-like composition primitives.</p>
            <p>Combine fixed and fluid dimensions for resilient terminal resizing behavior.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row" width="100%" height="100%" padding={1}>\n  <box width={24} border>\n    <text>Sidebar</text>\n  </box>\n  <box flexGrow={1} marginLeft={1} border>\n    <text>Main content</text>\n  </box>\n</box>`}
            />
          </>
        ),
      },
      {
        id: "keyboard",
        title: "Keyboard",
        searchText: "keyboard key events keymap kitty protocol ctrl alt shift repeated",
        content: (
          <>
            <p>Keyboard events include modifiers and can be configured for Kitty protocol enhancements.</p>
            <p>Handle input centrally in renderer hooks or locally in focused components.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("key", (event) => {\n  if (event.ctrl && event.name === "c") renderer.destroy()\n  if (event.name === "tab") console.log("switch focus")\n})`}
            />
          </>
        ),
      },
      {
        id: "console",
        title: "Console",
        searchText: "terminal console logs overlay save logs keybindings show hide",
        content: (
          <>
            <p>The embedded console captures logs and can be toggled inside your terminal UI.</p>
            <p>Use console options for position, sizing, colors, and debug-first workflows.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer({\n  useConsole: true,\n  consoleOptions: {\n    title: "Runtime Logs",\n    startInDebugMode: true,\n  },\n})\n\nrenderer.console.show()\nconsole.log("Renderer started")`}
            />
          </>
        ),
      },
      {
        id: "colors",
        title: "Colors",
        searchText: "parseColor RGBA hex named colors alpha transparency",
        content: (
          <>
            <p>Color inputs support named values, hex, and RGBA-compatible formats.</p>
            <p>Apply colors directly on renderables or through syntax style maps for code-like UIs.</p>
            <CodeBlock
              language="ts"
              code={`import { parseColor } from "@cascadetui/core"\n\nconst accent = parseColor("#19b58f")\nconst warning = parseColor("orange")\n\nnew TextRenderable(renderer, {\n  content: "Health check: OK",\n  color: accent,\n})`}
            />
          </>
        ),
      },
      {
        id: "lifecycle",
        title: "Lifecycle",
        searchText: "lifecycle start pause resume destroy cleanup onDestroy",
        content: (
          <>
            <p>Lifecycle methods make startup, suspension, and teardown deterministic.</p>
            <p>Always destroy renderer resources explicitly in scripts and integration tests.</p>
            <CodeBlock
              language="ts"
              code={`const renderer = await createCliRenderer()\nrenderer.start()\n\nsetTimeout(() => renderer.pause(), 250)\nsetTimeout(() => renderer.resume(), 500)\nsetTimeout(() => renderer.destroy(), 1000)`}
            />
          </>
        ),
      },
      {
        id: "selection",
        title: "Selection",
        searchText: "selectWord selectLine clickCount selection mouse double click triple click",
        content: (
          <>
            <p>Selection supports character, word, and line granularity based on click count and drag.</p>
            <p>This enables familiar editor-like interactions in code and text heavy interfaces.</p>
            <CodeBlock
              language="ts"
              code={`renderer.on("mouse", (event) => {\n  if (event.clickCount === 2) renderer.selectWord(event.x, event.y)\n  if (event.clickCount === 3) renderer.selectLine(event.x, event.y)\n})`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "components",
    group: "Components",
    title: "Components",
    subtitle: "Renderable catalog with practical examples for UI composition in terminal applications.",
    sections: [
      {
        id: "text",
        title: "Text",
        searchText: "TextRenderable text styles inline span strong emphasis content",
        content: (
          <>
            <p>Text is the base primitive for readable output and rich inline styling.</p>
            <CodeBlock language="tsx" code={`<text content="Hello Cascade" color="#0a8e6f" bold />`} />
          </>
        ),
      },
      {
        id: "box",
        title: "Box",
        searchText: "BoxRenderable border padding flex container layout",
        content: (
          <>
            <p>Box creates structure with borders, spacing, and layout rules.</p>
            <CodeBlock language="tsx" code={`<box border padding={1} width={32}>\n  <text>Settings</text>\n</box>`} />
          </>
        ),
      },
      {
        id: "input",
        title: "Input",
        searchText: "InputRenderable single line onInput onSubmit placeholder focused",
        content: (
          <>
            <p>Input is optimized for single-line values and submit-driven flows.</p>
            <CodeBlock
              language="tsx"
              code={`<input\n  placeholder="Search package"\n  focused\n  onInput={(value) => setQuery(value)}\n  onSubmit={(value) => runSearch(value)}\n/>`}
            />
          </>
        ),
      },
      {
        id: "textarea",
        title: "Textarea",
        searchText: "Textarea multiline editing selection undo redo highlights",
        content: (
          <>
            <p>Textarea supports multiline editing, navigation, and selection workflows.</p>
            <CodeBlock
              language="tsx"
              code={`<textarea\n  value={content()}\n  onInput={(next) => setContent(next)}\n  width="100%"\n  height={12}\n/>`}
            />
          </>
        ),
      },
      {
        id: "select",
        title: "Select",
        searchText: "SelectRenderable options selectedIndex keyboard navigation",
        content: (
          <>
            <p>Select provides vertical option navigation with configurable bindings.</p>
            <CodeBlock
              language="tsx"
              code={`<select\n  options={["TypeScript", "Rust", "Zig"]}\n  selectedIndex={0}\n  onSelect={(index) => setLanguage(index)}\n/>`}
            />
          </>
        ),
      },
      {
        id: "tab-select",
        title: "TabSelect",
        searchText: "TabSelect tabs compact navigation workspace switch",
        content: (
          <>
            <p>TabSelect is useful for mode switching and compact top-level navigation.</p>
            <CodeBlock
              language="tsx"
              code={`<tab_select\n  tabs={["Editor", "Diff", "Console"]}\n  selectedIndex={activeTab()}\n  onChange={(index) => setActiveTab(index)}\n/>`}
            />
          </>
        ),
      },
      {
        id: "scroll-box",
        title: "ScrollBox",
        searchText: "ScrollBox virtualized scrolling viewport content mouse wheel",
        content: (
          <>
            <p>ScrollBox clips content to viewport and enables vertical or horizontal scrolling.</p>
            <CodeBlock
              language="tsx"
              code={`<scrollbox height={10} border>\n  <text content={longLogOutput()} />\n</scrollbox>`}
            />
          </>
        ),
      },
      {
        id: "scroll-bar",
        title: "ScrollBar",
        searchText: "ScrollBar indicator thumb track attach scrollbox",
        content: (
          <>
            <p>ScrollBar provides visual feedback for long content regions and current viewport.</p>
            <CodeBlock
              language="tsx"
              code={`<box flexDirection="row">\n  <scrollbox id="content" width={70} height={18} />\n  <scrollbar targetId="content" />\n</box>`}
            />
          </>
        ),
      },
      {
        id: "slider",
        title: "Slider",
        searchText: "Slider value min max drag keyboard precision",
        content: (
          <>
            <p>Slider maps pointer and keyboard interaction to continuous numeric ranges.</p>
            <CodeBlock
              language="tsx"
              code={`<slider min={0} max={100} value={volume()} onChange={(next) => setVolume(next)} />`}
            />
          </>
        ),
      },
      {
        id: "code",
        title: "Code",
        searchText: "CodeRenderable syntax style language highlighting",
        content: (
          <>
            <p>Code renderable formats source content with syntax-aware styling rules.</p>
            <CodeBlock
              language="tsx"
              code={`<code\n  language="typescript"\n  content={source()}\n  lineNumbers\n/>`}
            />
          </>
        ),
      },
      {
        id: "markdown",
        title: "Markdown",
        searchText: "MarkdownRenderable markdown parser tables code blocks",
        content: (
          <>
            <p>Markdown renderable supports headings, lists, tables, and code fences.</p>
            <CodeBlock
              language="tsx"
              code={`<markdown\n  content={"# Notes\\n\\n- keyboard\\n- render loop\\n\\nCode sample:\\nconst ok = true"}\n/>`}
            />
          </>
        ),
      },
      {
        id: "line-numbers",
        title: "Line numbers",
        searchText: "LineNumberRenderable diagnostics gutters wrapped lines",
        content: (
          <>
            <p>LineNumberRenderable adds gutters and aligns line metadata with code content.</p>
            <CodeBlock
              language="tsx"
              code={`<line_number\n  content={source()}\n  lineNumbers\n  highlightedLines={[3, 7, 11]}\n/>`}
            />
          </>
        ),
      },
      {
        id: "frame-buffer",
        title: "FrameBuffer",
        searchText: "FrameBuffer offscreen rendering compositing reuse",
        content: (
          <>
            <p>FrameBuffer enables offscreen composition patterns and reusable snapshots.</p>
            <CodeBlock
              language="ts"
              code={`import { FrameBufferRenderable } from "@cascadetui/core"\n\nconst fb = new FrameBufferRenderable(renderer, { width: 40, height: 10 })\nrenderer.root.add(fb)`}
            />
          </>
        ),
      },
      {
        id: "ascii-font",
        title: "ASCIIFont",
        searchText: "ASCIIFontRenderable large text headings banners font style",
        content: (
          <>
            <p>ASCIIFont renders large banner text for dashboard headers and splash screens.</p>
            <CodeBlock language="tsx" code={`<ascii_font content="CASCADE" font="block" color="#0a8e6f" />`} />
          </>
        ),
      },
      {
        id: "diff",
        title: "Diff",
        searchText: "DiffRenderable unified split view git patches syntax",
        content: (
          <>
            <p>Diff visualizes patch content in unified or split mode with change highlighting.</p>
            <CodeBlock
              language="tsx"
              code={`<diff\n  view="split"\n  wrapMode="word"\n  diff={patch()}\n/>`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "solid",
    group: "Bindings",
    title: "Solid.js",
    subtitle: "Declarative Solid components mapped directly to Cascade renderables.",
    sections: [
      {
        id: "solid-render",
        title: "Render entrypoint",
        searchText: "solid render jsxImportSource preload bunfig",
        content: (
          <>
            <p>Configure `jsxImportSource` and preload, then render your root component.</p>
            <CodeBlock
              language="tsx"
              code={`import { render } from "@cascadetui/solid"\nimport { createSignal } from "solid-js"\n\nfunction App() {\n  const [count, setCount] = createSignal(0)\n  return <text content={\`Count: \${count()}\`} onMouseDown={() => setCount((n) => n + 1)} />\n}\n\nawait render(() => <App />)`}
            />
          </>
        ),
      },
      {
        id: "solid-hooks",
        title: "Hooks and interaction",
        searchText: "solid useKeyboard useRenderer terminal dimensions hooks",
        content: (
          <>
            <p>Use Solid hooks for keyboard shortcuts, resize behavior, and renderer access.</p>
            <CodeBlock
              language="ts"
              code={`useKeyboard((event) => {\n  if (event.name === "escape") process.exit(0)\n})`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "react",
    group: "Bindings",
    title: "React",
    subtitle: "React reconciler and hooks powered by the same Cascade renderer engine.",
    sections: [
      {
        id: "react-root",
        title: "createRoot",
        searchText: "react createRoot renderer reconciler app mount",
        content: (
          <>
            <p>Create a renderer once, attach a root, then render your React tree.</p>
            <CodeBlock
              language="tsx"
              code={`import { createCliRenderer } from "@cascadetui/core"\nimport { createRoot } from "@cascadetui/react"\n\nconst renderer = await createCliRenderer()\ncreateRoot(renderer).render(<App />)`}
            />
          </>
        ),
      },
      {
        id: "react-crash",
        title: "Crash propagation",
        searchText: "react crash boundary reportCrash componentStack diagnostics",
        content: (
          <>
            <p>Runtime failures in component trees can be captured and correlated with renderer diagnostics.</p>
            <p>Use error boundaries and crash reports together for fast production debugging.</p>
          </>
        ),
      },
      {
        id: "react-hooks",
        title: "Hooks",
        searchText: "react useKeyboard useRenderer useTerminalDimensions shortcuts",
        content: (
          <>
            <p>Hooks expose keyboard, renderer context, and terminal dimensions in idiomatic React style.</p>
            <CodeBlock
              language="tsx"
              code={`import { useKeyboard } from "@cascadetui/react"\n\nfunction App() {\n  useKeyboard((event) => {\n    if (event.name === "q") process.exit(0)\n  })\n\n  return <text content="Press q to quit" />\n}`}
            />
          </>
        ),
      },
    ],
  },
  {
    id: "reference",
    group: "Reference",
    title: "Reference",
    subtitle: "Operational reference for environment variables and Tree-sitter integration.",
    sections: [
      {
        id: "environment-variables",
        title: "Environment variables",
        searchText:
          "CASCADE_LOG_CRASH_REPORTS CASCADE_SHOW_STATS CASCADE_DEBUG_FFI CASCADE_TREE_SITTER_WORKER_PATH env vars",
        content: (
          <>
            <p>Key variables control diagnostics, FFI behavior, rendering fallbacks, and Tree-sitter worker path.</p>
            <CodeBlock
              language="bash"
              code={`CASCADE_LOG_CRASH_REPORTS=1 bun run app.ts\nCASCADE_SHOW_STATS=1 bun run app.ts\nCASCADE_DEBUG_FFI=1 bun run app.ts\nCASCADE_TREE_SITTER_WORKER_PATH=./parser.worker.ts bun run app.ts`}
            />
            <p>Use them per command for local debugging, or define them in your shell profile for persistent defaults.</p>
          </>
        ),
      },
      {
        id: "tree-sitter",
        title: "Tree-sitter",
        searchText: "tree-sitter syntax highlighting parsers worker wasm markdown typescript zig",
        content: (
          <>
            <p>Cascade can integrate Tree-sitter parsers for semantic syntax styling and Markdown code blocks.</p>
            <p>Parser assets are available for languages like TypeScript, JavaScript, Markdown, and Zig.</p>
            <CodeBlock
              language="ts"
              code={`import { getTreeSitterClient } from "@cascadetui/core"\n\nconst client = getTreeSitterClient()\nawait client.initialize()\n\n// Then pass tree-sitter client to renderables that support syntax-aware styling.`}
            />
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
