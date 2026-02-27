#!/usr/bin/env bun

import { Command } from "commander"
import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"

type Framework = "core" | "react" | "solid"

type TimingStats = {
  count: number
  averageMs: number
  medianMs: number
  p95Ms: number
  minMs: number
  maxMs: number
  stdDevMs: number
}

type MemorySample = {
  rss: number
  heapTotal: number
  heapUsed: number
  external: number
  arrayBuffers: number
}

type MemoryStats = {
  samples: number
  start: MemorySample
  end: MemorySample
  delta: MemorySample
  peak: MemorySample
}

type ScenarioResult = {
  framework: Framework
  scenario: string
  iterations: number
  warmupIterations: number
  elapsedMs: number
  updateStats: TimingStats
  memoryStats?: MemoryStats
  settings: Record<string, unknown>
}

type OutputMeta = {
  width: number
  height: number
  iterations: number
  warmupIterations: number
  scale: number
  memSampleEvery: number
}

type ListItem = {
  id: string
  text: string
}

type WorkloadPayload =
  | {
      kind: "text"
      value: string
    }
  | {
      kind: "list"
      items: ListItem[]
      mutateIds?: string[]
      itemsById?: Map<string, string>
    }

type WorkloadRunner = (ctx: {
  framework: Framework
  renderOnce: () => Promise<void>
  update: (payload: WorkloadPayload) => Promise<void>
  iterations: number
  measure?: (fn: () => Promise<void>) => Promise<void>
  onIterationDone?: (i: number) => void
}) => Promise<void>

const realStdoutWrite = process.stdout.write.bind(process.stdout)

const program = new Command()
program
  .name("frameworks-benchmark")
  .description("Benchmark React vs Solid vs Core (Cascade) using the same render workload")
  .option("-i, --iterations <count>", "iterations per scenario", "800")
  .option("--warmup-iterations <count>", "warmup iterations per scenario", "80")
  .option("--width <n>", "test renderer width", "140")
  .option("--height <n>", "test renderer height", "48")
  .option("--scale <n>", "scale dataset sizes", "1")
  .option("--mem-sample-every <count>", "sample memory every N iterations (0 disables)", "10")
  .option("--framework <name>", "framework: core, react, solid (repeatable)", collect, [])
  .option(
    "--scenario <name>",
    "scenario: text_update, list_replace, list_shuffle, list_keyed_shuffle, list_mutate_10pct (repeatable)",
    collect,
    [],
  )
  .option("--trace", "emit trace timings")
  .option("--json [path]", "write JSON results to file")
  .option("--no-output", "suppress stdout output")
  .parse(process.argv)

const options = program.opts()

const iterations = Math.max(1, Math.floor(toNumber(options.iterations, 800)))
const warmupIterations = Math.max(0, Math.floor(toNumber(options.warmupIterations, 80)))
const width = Math.max(40, Math.floor(toNumber(options.width, 140)))
const height = Math.max(12, Math.floor(toNumber(options.height, 48)))
const scale = Math.max(0.25, toNumber(options.scale, 1))
const memSampleEvery = Math.max(0, Math.floor(toNumber(options.memSampleEvery, 10)))
const outputEnabled = options.output !== false

const frameworkFilters: Framework[] = normalizeList(options.framework)
const scenarioFilters: string[] = normalizeList(options.scenario)

const frameworksToRun: Framework[] =
  frameworkFilters.length > 0 ? frameworkFilters : ("core react solid".split(" ") as Framework[])

const scenariosToRun =
  scenarioFilters.length > 0
    ? scenarioFilters
    : ["text_update", "list_replace", "list_shuffle", "list_keyed_shuffle", "list_mutate_10pct"]

const jsonArg = options.json
const jsonPath =
  typeof jsonArg === "string"
    ? path.resolve(process.cwd(), jsonArg)
    : jsonArg
      ? path.resolve(process.cwd(), "latest-frameworks-bench-run.json")
      : null

if (jsonPath) {
  const dir = path.dirname(jsonPath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  if (existsSync(jsonPath)) {
    realStdoutWrite(`Error: output file already exists: ${jsonPath}\n`)
    process.exit(1)
  }
}

const results: ScenarioResult[] = []
const scenarioLines: string[] = []

for (const framework of frameworksToRun) {
  for (const scenario of scenariosToRun) {
    const run = await runScenario({ framework, scenario, iterations, warmupIterations, width, height, scale, memSampleEvery })
    results.push(run)
    scenarioLines.push(formatScenarioResult(run))
  }
}

await outputResults(
  {
    width,
    height,
    iterations,
    warmupIterations,
    scale,
    memSampleEvery,
  },
  results,
  scenarioLines,
  outputEnabled,
  jsonPath,
)

async function runScenario(config: {
  framework: Framework
  scenario: string
  iterations: number
  warmupIterations: number
  width: number
  height: number
  scale: number
  memSampleEvery: number
}): Promise<ScenarioResult> {
  if (config.framework === "core") {
    return runCore(config)
  }
  if (config.framework === "react") {
    return runReact(config)
  }
  return runSolid(config)
}

async function runCore(config: {
  framework: Framework
  scenario: string
  iterations: number
  warmupIterations: number
  width: number
  height: number
  scale: number
  memSampleEvery: number
}): Promise<ScenarioResult> {
  const { BoxRenderable, TextRenderable } = await import("../packages/core/src/index.js")
  const { createTestRenderer } = await import("../packages/core/src/testing.js")


  const { renderer, renderOnce } = await createTestRenderer({
    width: config.width,
    height: config.height,
    useAlternateScreen: false,
    useConsole: false,
    trace: options.trace === true,
    traceWriter: options.trace
      ? (line: string) => {
          realStdoutWrite(`${line}\n`)
        }
      : undefined,
  })

  renderer.requestRender = () => {}

  const root = new BoxRenderable(renderer, { id: "bench-root", width: "100%", height: "100%" })
  renderer.root.add(root)

  const { warmup, run, settings } = createWorkload(config.scenario, config.scale)

  let mountedText: InstanceType<typeof TextRenderable> | null = null
  let mountedListBox: InstanceType<typeof BoxRenderable> | null = null
  let mountedListNodes: Map<string, InstanceType<typeof TextRenderable>> | null = null

  const ensureTextMounted = (initial: string) => {
    if (mountedText) return
    clearChildrenAndDestroy(root)
    mountedText = new TextRenderable(renderer, { id: "bench-text", content: initial })
    root.add(mountedText)
  }

  const ensureListMounted = (initial: ListItem[]) => {
    if (mountedListBox && mountedListNodes) return
    clearChildrenAndDestroy(root)
    mountedListBox = new BoxRenderable(renderer, { id: "bench-list", width: "100%", height: "100%" })
    mountedListNodes = new Map()
    for (let i = 0; i < initial.length; i += 1) {
      const item = initial[i]!
      const node = new TextRenderable(renderer, { id: item.id, content: item.text })
      mountedListNodes.set(item.id, node)
      mountedListBox.add(node)
    }
    root.add(mountedListBox)
  }

  const applyListPayload = (payload: Extract<WorkloadPayload, { kind: "list" }>) => {
    ensureListMounted(payload.items)
    if (!mountedListBox || !mountedListNodes) return

    if (config.scenario === "list_mutate_10pct" && payload.mutateIds?.length && payload.itemsById) {
      for (const id of payload.mutateIds) {
        const node = mountedListNodes.get(id)
        const next = payload.itemsById.get(id)
        if (node && next !== undefined) {
          node.content = next
        }
      }
      return
    }

    const nextNodes: InstanceType<typeof TextRenderable>[] = []
    for (const item of payload.items) {
      let node = mountedListNodes.get(item.id)
      if (!node) {
        node = new TextRenderable(renderer, { id: item.id, content: item.text })
        mountedListNodes.set(item.id, node)
      } else {
        node.content = item.text
      }
      nextNodes.push(node)
    }

    const listBoxAny = mountedListBox as unknown as {
      replaceChildren?: (nodes: InstanceType<typeof TextRenderable>[], options?: { destroyRemoved?: boolean }) => void
    }
    const destroyRemoved = config.scenario === "list_replace"
    if (config.scenario !== "list_mutate_10pct") {
      if (typeof listBoxAny.replaceChildren === "function") {
        listBoxAny.replaceChildren(nextNodes, destroyRemoved ? { destroyRemoved: true } : undefined)
        return
      }
      const nextIds = new Set(nextNodes.map((node) => node.id))
      for (const child of mountedListBox.getChildren()) {
        if (!nextIds.has(child.id)) {
          mountedListBox.remove(child.id)
        }
      }
      for (let i = 0; i < nextNodes.length; i += 1) {
        mountedListBox.add(nextNodes[i]!, i)
      }
      return
    }

    if (mountedListBox.getChildrenCount() !== nextNodes.length) {
      if (typeof listBoxAny.replaceChildren === "function") {
        listBoxAny.replaceChildren(nextNodes)
        return
      }
      const nextIds = new Set(nextNodes.map((node) => node.id))
      for (const child of mountedListBox.getChildren()) {
        if (!nextIds.has(child.id)) {
          mountedListBox.remove(child.id)
        }
      }
      for (let i = 0; i < nextNodes.length; i += 1) {
        mountedListBox.add(nextNodes[i]!, i)
      }
    }
  }

  try {
    await warmup({
      framework: "core",
      renderOnce,
      update: async (payload) => {
        if (payload.kind === "text") {
          ensureTextMounted(payload.value)
          if (mountedText) {
            mountedText.content = payload.value
          }
          await renderOnce()
          return
        }

        if (payload.kind === "list") {
          applyListPayload(payload)
          await renderOnce()
          return
        }
      },
      iterations: config.warmupIterations,
    })

    const durations: number[] = []
    const measurementStart = Date.now()
    const memStart = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null
    const memSamples: MemorySample[] = []

    await run({
      framework: "core",
      renderOnce,
      update: async (payload) => {
        if (payload.kind === "text") {
          ensureTextMounted(payload.value)
          if (mountedText) {
            mountedText.content = payload.value
          }
          await renderOnce()
          return
        }

        if (payload.kind === "list") {
          applyListPayload(payload)
          await renderOnce()
          return
        }
      },
      iterations: config.iterations,
      measure: async (fn) => {
        const start = performance.now()
        await fn()
        durations.push(performance.now() - start)
      },
      onIterationDone: (i) => {
        if (config.memSampleEvery > 0 && (i + 1) % config.memSampleEvery === 0) {
          memSamples.push(readMemorySample())
        }
      },
    })

    const elapsedMs = Date.now() - measurementStart
    const memEnd = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null

    return {
      framework: "core",
      scenario: config.scenario,
      iterations: config.iterations,
      warmupIterations: config.warmupIterations,
      elapsedMs,
      updateStats: computeTimingStats(durations),
      memoryStats: memStart && memEnd ? computeMemoryStats(memSamples, memStart, memEnd) : undefined,
      settings,
    }
  } finally {
    renderer.destroy()
  }
}

async function runReact(config: {
  framework: Framework
  scenario: string
  iterations: number
  warmupIterations: number
  width: number
  height: number
  scale: number
  memSampleEvery: number
}): Promise<ScenarioResult> {
  const React = await import("react")
  const { createTestRenderer } = await import("@cascadetui/core/testing")
  const { createRoot } = await import("@cascadetui/react")

  const { renderer, renderOnce } = await createTestRenderer({
    width: config.width,
    height: config.height,
    useAlternateScreen: false,
    useConsole: false,
  })

  const root = createRoot(renderer)

  const { warmup, run, settings } = createWorkload(config.scenario, config.scale)

  const flushMicrotasks = async () => {
    await Promise.resolve()
  }

  const getTextElement = (value: string) =>
    React.createElement(
      "box",
      null,
      React.createElement("text", { content: value }),
    )

  const getListElement = (items: ListItem[]) =>
    React.createElement(
      "box",
      null,
      items.map((item) => React.createElement("text", { key: item.id, content: item.text })),
    )

  try {
    await warmup({
      framework: "react",
      renderOnce,
      update: async (payload) => {
        if (payload.kind === "text") {
          root.render(getTextElement(payload.value))
          await renderOnce()
          await flushMicrotasks()
          return
        }
        if (payload.kind === "list") {
          root.render(getListElement(payload.items))
          await renderOnce()
          await flushMicrotasks()
          return
        }
      },
      iterations: config.warmupIterations,
    })

    const durations: number[] = []
    const measurementStart = Date.now()
    const memStart = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null
    const memSamples: MemorySample[] = []

    await run({
      framework: "react",
      renderOnce,
      update: async (payload) => {
        if (payload.kind === "text") {
          root.render(getTextElement(payload.value))
          await renderOnce()
          await flushMicrotasks()
          return
        }
        if (payload.kind === "list") {
          root.render(getListElement(payload.items))
          await renderOnce()
          await flushMicrotasks()
          return
        }
      },
      iterations: config.iterations,
      measure: async (fn) => {
        const start = performance.now()
        await fn()
        durations.push(performance.now() - start)
      },
      onIterationDone: (i) => {
        if (config.memSampleEvery > 0 && (i + 1) % config.memSampleEvery === 0) {
          memSamples.push(readMemorySample())
        }
      },
    })

    const elapsedMs = Date.now() - measurementStart
    const memEnd = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null

    return {
      framework: "react",
      scenario: config.scenario,
      iterations: config.iterations,
      warmupIterations: config.warmupIterations,
      elapsedMs,
      updateStats: computeTimingStats(durations),
      memoryStats: memStart && memEnd ? computeMemoryStats(memSamples, memStart, memEnd) : undefined,
      settings,
    }
  } finally {
    root.unmount()
    await flushMicrotasks()
    renderer.destroy()
  }
}

function clearChildren(parent: { getChildren: () => { id: string }[]; remove: (id: string) => void }): void {
  const children = parent.getChildren()
  for (const child of children) {
    parent.remove(child.id)
  }
}

function clearChildrenAndDestroy(parent: {
  getChildren: () => any[]
  remove: (id: string) => void
}): void {
  const children = parent.getChildren()
  for (const child of children) {
    parent.remove(child.id)
    child?.destroyRecursively?.()
    child?.destroy?.()
  }
}

async function runSolid(config: {
  framework: Framework
  scenario: string
  iterations: number
  warmupIterations: number
  width: number
  height: number
  scale: number
  memSampleEvery: number
}): Promise<ScenarioResult> {
  const { createSignal } = await import("solid-js")
  const solid = await import("@cascadetui/solid")
  const { testRender, createElement: h } = solid as unknown as {
    testRender: (node: () => unknown, renderConfig?: any) => Promise<any>
    createElement: (...args: any[]) => any
  }

  const { warmup, run, settings } = createWorkload(config.scenario, config.scale)

  let setText: ((v: string) => void) | null = null
  let setList: ((items: ListItem[]) => void) | null = null

  let setup: any | null = null
  const ensureMounted = async (initial: WorkloadPayload) => {
    if (setup) return

    if (initial.kind === "text") {
      const App = () => {
        const [value, _set] = createSignal(initial.value)
        setText = _set
        return h("text", { content: value() })
      }

      setup = await testRender(() => App(), {
        width: config.width,
        height: config.height,
        useAlternateScreen: false,
        useConsole: false,
        onDestroy: () => {},
      })
      setup.renderer.requestRender = () => {}
      return
    }

    const App = () => {
      const [items, _set] = createSignal(initial.items)
      setList = _set
      return h("box", null, ...items().map((item) => h("text", { content: item.text })))
    }

    setup = await testRender(() => App(), {
      width: config.width,
      height: config.height,
      useAlternateScreen: false,
      useConsole: false,
      onDestroy: () => {},
    })
    setup.renderer.requestRender = () => {}
  }

  try {
    await warmup({
      framework: "solid",
      renderOnce: async () => {
        await setup?.renderOnce?.()
      },
      update: async (payload) => {
        if (payload.kind === "text") {
          await ensureMounted(payload)
          setText?.(payload.value)
          await setup.renderOnce()
          return
        }
        if (payload.kind === "list") {
          await ensureMounted(payload)
          setList?.(payload.items)
          await setup.renderOnce()
          return
        }
      },
      iterations: config.warmupIterations,
    })

    const durations: number[] = []
    const measurementStart = Date.now()
    const memStart = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null
    const memSamples: MemorySample[] = []

    await run({
      framework: "solid",
      renderOnce: async () => {
        await setup?.renderOnce?.()
      },
      update: async (payload) => {
        if (payload.kind === "text") {
          await ensureMounted(payload)
          setText?.(payload.value)
          await setup.renderOnce()
          return
        }
        if (payload.kind === "list") {
          await ensureMounted(payload)
          setList?.(payload.items)
          await setup.renderOnce()
          return
        }
      },
      iterations: config.iterations,
      measure: async (fn) => {
        const start = performance.now()
        await fn()
        durations.push(performance.now() - start)
      },
      onIterationDone: (i) => {
        if (config.memSampleEvery > 0 && (i + 1) % config.memSampleEvery === 0) {
          memSamples.push(readMemorySample())
        }
      },
    })

    const elapsedMs = Date.now() - measurementStart
    const memEnd = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null

    return {
      framework: "solid",
      scenario: config.scenario,
      iterations: config.iterations,
      warmupIterations: config.warmupIterations,
      elapsedMs,
      updateStats: computeTimingStats(durations),
      memoryStats: memStart && memEnd ? computeMemoryStats(memSamples, memStart, memEnd) : undefined,
      settings,
    }
  } finally {
    setup?.renderer?.destroy?.()
  }
}

function createWorkload(scenario: string, scaleValue: number): {
  warmup: WorkloadRunner
  run: WorkloadRunner
  settings: Record<string, unknown>
} {
  if (scenario === "text_update") {
    const textLen = scaled(256, scaleValue)
    const settings = { scenario, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "text", value: makeText(textLen, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "text", value: makeText(textLen, i) } as const
        if (measure) {
          await measure(async () => update(payload))
        } else {
          await update(payload)
        }
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_replace") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const settings = { scenario, itemsCount, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", items: makeListItems(itemsCount, textLen, i, true) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: makeListItems(itemsCount, textLen, i, true) } as const
        if (measure) {
          await measure(async () => update(payload))
        } else {
          await update(payload)
        }
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_shuffle") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const base = makeListItems(itemsCount, textLen, 1)
    const settings = { scenario, itemsCount, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", items: shuffleItems(base, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: shuffleItems(base, i) } as const
        if (measure) {
          await measure(async () => update(payload))
        } else {
          await update(payload)
        }
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_keyed_shuffle") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const base = makeListItems(itemsCount, textLen, 1)
    const settings = { scenario, itemsCount, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", items: shuffleItems(base, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: shuffleItems(base, i) } as const
        if (measure) {
          await measure(async () => update(payload))
        } else {
          await update(payload)
        }
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_mutate_10pct") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const mutateCount = Math.max(1, Math.floor(itemsCount * 0.1))
    let items = makeListItems(itemsCount, textLen, 1)
    const settings = { scenario, itemsCount, textLen, mutateCount }

    const mutateItems = (seed: number) => {
      const indices = new Set<number>()
      const rng = createRng((seed ^ 0x9e3779b9) >>> 0)
      while (indices.size < mutateCount) {
        indices.add(Math.floor(rng() * itemsCount))
      }

      const mutateIds: string[] = []
      const itemsById = new Map<string, string>()
      const nextItems: ListItem[] = items.map((item, idx) => {
        if (!indices.has(idx)) return item
        const nextText = makeText(textLen, seed + idx)
        mutateIds.push(item.id)
        itemsById.set(item.id, nextText)
        return { id: item.id, text: nextText }
      })
      items = nextItems
      return { items: nextItems, mutateIds, itemsById }
    }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", ...mutateItems(i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", ...mutateItems(i) } as const
        if (measure) {
          await measure(async () => update(payload))
        } else {
          await update(payload)
        }
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  throw new Error(`Unknown scenario: ${scenario}`)
}

function shuffleItems(list: ListItem[], seed: number): ListItem[] {
  const out = [...list]
  const rng = createRng((seed ^ 0x9e3779b9) >>> 0)
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]!
    out[j] = tmp!
  }
  return out
}

function makeListItems(count: number, itemLen: number, seed: number, uniqueIds: boolean = false): ListItem[] {
  const out: ListItem[] = []
  const baseId = uniqueIds ? `${seed}-` : ""
  for (let i = 0; i < count; i += 1) {
    out.push({ id: `item-${baseId}${i}`, text: makeText(itemLen, seed + i) })
  }
  return out
}

function makeText(len: number, seed: number): string {
  const rng = createRng((seed ^ 0x85ebca6b) >>> 0)
  let out = ""
  while (out.length < len) {
    out += Math.floor(rng() * 36).toString(36)
  }
  return out.slice(0, len)
}

function createRng(initialSeed: number): () => number {
  let state = initialSeed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function scaled(value: number, scaleValue: number): number {
  return Math.max(1, Math.round(value * scaleValue))
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function collect(value: unknown, previous: unknown[]): unknown[] {
  return [...previous, value]
}

function normalizeList(value: unknown): any[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .map((v) => v.toLowerCase())
  }
  return [String(value).trim().toLowerCase()].filter(Boolean)
}

function shouldSampleMemory(memSampleEveryValue: number): boolean {
  return memSampleEveryValue > 0
}

function readMemorySample(): MemorySample {
  const usage = process.memoryUsage()
  return {
    rss: usage.rss ?? 0,
    heapTotal: usage.heapTotal ?? 0,
    heapUsed: usage.heapUsed ?? 0,
    external: usage.external ?? 0,
    arrayBuffers: usage.arrayBuffers ?? 0,
  }
}

function computeMemoryStats(samples: MemorySample[], start: MemorySample, end: MemorySample): MemoryStats {
  const all = [start, ...samples, end]
  const peak = { ...start }

  for (const sample of all) {
    peak.rss = Math.max(peak.rss, sample.rss)
    peak.heapTotal = Math.max(peak.heapTotal, sample.heapTotal)
    peak.heapUsed = Math.max(peak.heapUsed, sample.heapUsed)
    peak.external = Math.max(peak.external, sample.external)
    peak.arrayBuffers = Math.max(peak.arrayBuffers, sample.arrayBuffers)
  }

  return {
    samples: all.length,
    start,
    end,
    delta: diffMemory(start, end),
    peak,
  }
}

function diffMemory(start: MemorySample, end: MemorySample): MemorySample {
  return {
    rss: end.rss - start.rss,
    heapTotal: end.heapTotal - start.heapTotal,
    heapUsed: end.heapUsed - start.heapUsed,
    external: end.external - start.external,
    arrayBuffers: end.arrayBuffers - start.arrayBuffers,
  }
}

function computeTimingStats(durations: number[]): TimingStats {
  const sorted = [...durations].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((acc, value) => acc + value, 0)
  const average = count > 0 ? sum / count : 0
  const min = sorted[0] ?? 0
  const max = sorted[count - 1] ?? 0
  const median = count > 0 ? (sorted[Math.floor(count / 2)] ?? 0) : 0
  const p95 = count > 0 ? (sorted[Math.floor(count * 0.95)] ?? 0) : 0
  const stdDev =
    count > 0 ? Math.sqrt(sorted.reduce((acc, v) => acc + Math.pow(v - average, 2), 0) / count) : 0

  return {
    count,
    averageMs: average,
    medianMs: median,
    p95Ms: p95,
    minMs: min,
    maxMs: max,
    stdDevMs: stdDev,
  }
}

async function outputResults(
  meta: OutputMeta,
  scenarioResults: ScenarioResult[],
  lines: string[],
  output: boolean,
  outputPath: string | null,
): Promise<void> {
  const runId = new Date().toISOString()
  const payload = {
    runId,
    config: meta,
    results: scenarioResults,
  }

  if (output) {
    writeLine(
      `frameworks-benchmark iters=${meta.iterations} warmup=${meta.warmupIterations} width=${meta.width} height=${meta.height} scale=${meta.scale}`,
    )
    for (const line of lines) {
      writeLine(line)
    }
  }

  if (outputPath) {
    const json = JSON.stringify(payload, null, 2)
    await Bun.write(outputPath, json)
  }
}

function formatBytes(value: number): string {
  return `${(value / (1024 * 1024)).toFixed(2)}MB`
}

function formatScenarioResult(result: ScenarioResult): string {
  const mem = result.memoryStats
  const memSummary = mem
    ? ` memDeltaRss=${formatBytes(mem.delta.rss)}` +
      ` memDeltaHeap=${formatBytes(mem.delta.heapUsed)}` +
      ` memDeltaExt=${formatBytes(mem.delta.external)}` +
      ` memDeltaAB=${formatBytes(mem.delta.arrayBuffers)}` +
      ` memPeakRss=${formatBytes(mem.peak.rss)}`
    : ""

  return `framework=${result.framework} scenario=${result.scenario} iters=${result.updateStats.count} elapsedMs=${result.elapsedMs} avgMs=${result.updateStats.averageMs.toFixed(3)} medianMs=${result.updateStats.medianMs.toFixed(3)} p95Ms=${result.updateStats.p95Ms.toFixed(3)} minMs=${result.updateStats.minMs.toFixed(3)} maxMs=${result.updateStats.maxMs.toFixed(3)}${memSummary}`
}

function writeLine(line: string): void {
  realStdoutWrite(`${line}\n`)
}
