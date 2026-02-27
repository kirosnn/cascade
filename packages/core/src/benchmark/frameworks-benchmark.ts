#!/usr/bin/env bun

import { BoxRenderable, TextRenderable } from "../index"
import { createTestRenderer } from "../testing"
import { Command } from "commander"
import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"

type Framework = "core"

type TimingStats = {
  count: number
  averageMs: number
  medianMs: number
  p95Ms: number
  minMs: number
  maxMs: number
  stdDevMs: number
}

type PhaseStats = {
  total: TimingStats
  build: TimingStats
  render: TimingStats
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
  phaseStats: PhaseStats
  memoryStats?: MemoryStats
  settings: Record<string, unknown>
  derived: {
    buildSharePctAvg: number
    renderSharePctAvg: number
  }
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

type PhaseDurations = {
  buildMs: number
  renderMs: number
  totalMs: number
}

type WorkloadRunner = (ctx: {
  framework: Framework
  renderOnce: () => Promise<void>
  update: (payload: WorkloadPayload) => Promise<PhaseDurations>
  iterations: number
  measure?: (fn: () => Promise<PhaseDurations>) => Promise<void>
  onIterationDone?: (i: number) => void
}) => Promise<void>

const realStdoutWrite = process.stdout.write.bind(process.stdout)

const program = new Command()
program
  .name("frameworks-benchmark")
  .description("Benchmark core (Cascade) using the same render workload")
  .option("-i, --iterations <count>", "iterations per scenario", "800")
  .option("--warmup-iterations <count>", "warmup iterations per scenario", "80")
  .option("--width <n>", "test renderer width", "140")
  .option("--height <n>", "test renderer height", "48")
  .option("--scale <n>", "scale dataset sizes", "1")
  .option("--mem-sample-every <count>", "sample memory every N iterations (0 disables)", "10")
  .option(
    "--scenario <name>",
    "scenario: text_update, list_rebuild, list_keyed_shuffle, list_mutate_10pct, list_replace, list_shuffle (repeatable)",
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

const scenarioFilters: string[] = normalizeList(options.scenario)

const frameworksToRun: Framework[] = ["core"]

const scenariosToRun =
  scenarioFilters.length > 0
    ? scenarioFilters
    : ["text_update", "list_rebuild", "list_keyed_shuffle", "list_mutate_10pct", "list_replace", "list_shuffle"]

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
    const run = await runScenario({
      framework,
      scenario,
      iterations,
      warmupIterations,
      width,
      height,
      scale,
      memSampleEvery,
    })
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
  return runCore(config)
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

  const listState = {
    box: null as BoxRenderable | null,
    nodes: new Map<string, TextRenderable>(),
  }

  const { warmup, run, settings } = createWorkload(config.scenario, config.scale)

  try {
    await warmup({
      framework: "core",
      renderOnce,
      update: async (payload) => applyUpdateMeasured(config.scenario, root, listState, renderer, renderOnce, payload),
      iterations: config.warmupIterations,
    })

    const totalDurations: number[] = []
    const buildDurations: number[] = []
    const renderDurations: number[] = []

    const measurementStart = Date.now()
    const memStart = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null
    const memSamples: MemorySample[] = []

    await run({
      framework: "core",
      renderOnce,
      update: async (payload) => applyUpdateMeasured(config.scenario, root, listState, renderer, renderOnce, payload),
      iterations: config.iterations,
      measure: async (fn) => {
        const d = await fn()
        totalDurations.push(d.totalMs)
        buildDurations.push(d.buildMs)
        renderDurations.push(d.renderMs)
      },
      onIterationDone: (i) => {
        if (config.memSampleEvery > 0 && (i + 1) % config.memSampleEvery === 0) {
          memSamples.push(readMemorySample())
        }
      },
    })

    const elapsedMs = Date.now() - measurementStart
    const memEnd = shouldSampleMemory(config.memSampleEvery) ? readMemorySample() : null

    const totalStats = computeTimingStats(totalDurations)
    const buildStats = computeTimingStats(buildDurations)
    const renderStats = computeTimingStats(renderDurations)

    const avgTotal = totalStats.averageMs
    const avgBuild = buildStats.averageMs
    const avgRender = renderStats.averageMs

    const buildSharePctAvg = avgTotal > 0 ? (avgBuild / avgTotal) * 100 : 0
    const renderSharePctAvg = avgTotal > 0 ? (avgRender / avgTotal) * 100 : 0

    return {
      framework: "core",
      scenario: config.scenario,
      iterations: config.iterations,
      warmupIterations: config.warmupIterations,
      elapsedMs,
      phaseStats: {
        total: totalStats,
        build: buildStats,
        render: renderStats,
      },
      memoryStats: memStart && memEnd ? computeMemoryStats(memSamples, memStart, memEnd) : undefined,
      settings,
      derived: {
        buildSharePctAvg,
        renderSharePctAvg,
      },
    }
  } finally {
    renderer.destroy()
  }
}

async function applyUpdateMeasured(
  scenario: string,
  root: BoxRenderable,
  listState: { box: BoxRenderable | null; nodes: Map<string, TextRenderable> },
  renderer: any,
  renderOnce: () => Promise<void>,
  payload: WorkloadPayload,
): Promise<PhaseDurations> {
  const t0 = performance.now()

  if (payload.kind === "text") {
    const tBuild0 = performance.now()
    const existing = root.getChildren()[0]
    if (existing instanceof TextRenderable) {
      existing.content = payload.value
    } else {
      root.clear()
      root.add(new TextRenderable(renderer, { id: "bench-text", content: payload.value }))
    }
    const tBuild1 = performance.now()
    const tRender0 = performance.now()
    await renderOnce()
    const tRender1 = performance.now()

    return {
      buildMs: tBuild1 - tBuild0,
      renderMs: tRender1 - tRender0,
      totalMs: tRender1 - t0,
    }
  }

  const tBuild0 = performance.now()

  if (scenario === "list_rebuild" || scenario === "list_replace" || scenario === "list_shuffle") {
    root.clear()
    const box = new BoxRenderable(renderer, { id: "bench-list", width: "100%", height: "100%" })
    for (let i = 0; i < payload.items.length; i += 1) {
      box.add(new TextRenderable(renderer, { id: payload.items[i]!.id, content: payload.items[i]!.text }))
    }
    root.add(box)
  } else if (scenario === "list_keyed_shuffle") {
    let box = listState.box
    if (!box) {
      box = new BoxRenderable(renderer, { id: "bench-list", width: "100%", height: "100%" })
      listState.box = box
      root.clear()
      root.add(box)
    }

    const nextNodes: TextRenderable[] = []
    for (const item of payload.items) {
      let node = listState.nodes.get(item.id)
      if (!node) {
        node = new TextRenderable(renderer, { id: item.id, content: item.text })
        listState.nodes.set(item.id, node)
      }
      nextNodes.push(node)
    }

    box.replaceChildren(nextNodes)
  } else if (scenario === "list_mutate_10pct") {
    let box = listState.box
    if (!box) {
      box = new BoxRenderable(renderer, { id: "bench-list", width: "100%", height: "100%" })
      listState.box = box
      root.clear()
      root.add(box)

      for (const item of payload.items) {
        const node = new TextRenderable(renderer, { id: item.id, content: item.text })
        listState.nodes.set(item.id, node)
        box.add(node)
      }
    } else {
      const ids = payload.mutateIds ?? []
      for (const id of ids) {
        const node = listState.nodes.get(id)
        if (node) {
          const next = payload.itemsById?.get(id)
          if (next) node.content = next
        }
      }
    }
  } else {
    throw new Error(`Unknown scenario: ${scenario}`)
  }

  const tBuild1 = performance.now()
  const tRender0 = performance.now()
  await renderOnce()
  const tRender1 = performance.now()

  return {
    buildMs: tBuild1 - tBuild0,
    renderMs: tRender1 - tRender0,
    totalMs: tRender1 - t0,
  }
}

function createWorkload(
  scenario: string,
  scaleValue: number,
): {
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
        if (measure) await measure(async () => update(payload))
        else await update(payload)
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_rebuild") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const settings = { scenario, itemsCount, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", items: makeList(itemsCount, textLen, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: makeList(itemsCount, textLen, i) } as const
        if (measure) await measure(async () => update(payload))
        else await update(payload)
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_keyed_shuffle") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const base = makeList(itemsCount, textLen, 1)
    const settings = { scenario, itemsCount, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", items: shuffle(base, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: shuffle(base, i) } as const
        if (measure) await measure(async () => update(payload))
        else await update(payload)
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_mutate_10pct") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const mutatePct = 0.1
    const mutateCount = Math.max(1, Math.round(itemsCount * mutatePct))
    const base = makeList(itemsCount, textLen, 1)
    const settings = { scenario, itemsCount, textLen, mutatePct, mutateCount }

    const pickMutateIds = (seed: number): string[] => {
      const rng = createRng((seed ^ 0x27d4eb2d) >>> 0)
      const out: string[] = []
      const used = new Set<number>()
      while (out.length < mutateCount) {
        const idx = Math.floor(rng() * itemsCount)
        if (used.has(idx)) continue
        used.add(idx)
        out.push(base[idx]!.id)
      }
      return out
    }

    const applyMutations = (seed: number): ListItem[] => {
      const ids = new Set(pickMutateIds(seed))
      const out: ListItem[] = []
      for (let i = 0; i < base.length; i += 1) {
        const item = base[i]!
        if (ids.has(item.id)) out.push({ id: item.id, text: makeText(textLen, seed + i * 31) })
        else out.push(item)
      }
      return out
    }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        const items = applyMutations(i)
        const mutateIds = pickMutateIds(i)
        const itemsById = new Map<string, string>()
        for (const item of items) {
          itemsById.set(item.id, item.text)
        }
        await update({ kind: "list", items, mutateIds, itemsById })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const items = applyMutations(i)
        const mutateIds = pickMutateIds(i)
        const itemsById = new Map<string, string>()
        for (const item of items) {
          itemsById.set(item.id, item.text)
        }
        const payload = { kind: "list", items, mutateIds, itemsById } as const
        if (measure) await measure(async () => update(payload))
        else await update(payload)
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
        await update({ kind: "list", items: makeList(itemsCount, textLen, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: makeList(itemsCount, textLen, i) } as const
        if (measure) await measure(async () => update(payload))
        else await update(payload)
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  if (scenario === "list_shuffle") {
    const itemsCount = scaled(200, scaleValue)
    const textLen = scaled(20, scaleValue)
    const base = makeList(itemsCount, textLen, 1)
    const settings = { scenario, itemsCount, textLen }

    const warmup: WorkloadRunner = async ({ update, iterations }) => {
      for (let i = 0; i < iterations; i += 1) {
        await update({ kind: "list", items: shuffle(base, i) })
      }
    }

    const run: WorkloadRunner = async ({ update, iterations, measure, onIterationDone }) => {
      for (let i = 0; i < iterations; i += 1) {
        const payload = { kind: "list", items: shuffle(base, i) } as const
        if (measure) await measure(async () => update(payload))
        else await update(payload)
        onIterationDone?.(i)
      }
    }

    return { warmup, run, settings }
  }

  throw new Error(`Unknown scenario: ${scenario}`)
}

function shuffle(list: ListItem[], seed: number): ListItem[] {
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

function makeList(count: number, itemLen: number, seed: number): ListItem[] {
  const out: ListItem[] = []
  for (let i = 0; i < count; i += 1) {
    out.push({ id: `item-${i}`, text: makeText(itemLen, seed + i) })
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
      `frameworks-benchmark iters=${meta.iterations} warmup=${meta.warmupIterations} width=${meta.width} height=${meta.height} scale=${meta.scale} memSampleEvery=${meta.memSampleEvery}`,
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
  const total = result.phaseStats.total
  const build = result.phaseStats.build
  const render = result.phaseStats.render

  const mem = result.memoryStats
  const memSummary = mem
    ? ` memDeltaRss=${formatBytes(mem.delta.rss)}` +
      ` memDeltaHeap=${formatBytes(mem.delta.heapUsed)}` +
      ` memDeltaExt=${formatBytes(mem.delta.external)}` +
      ` memDeltaAB=${formatBytes(mem.delta.arrayBuffers)}` +
      ` memPeakRss=${formatBytes(mem.peak.rss)}`
    : ""

  const phaseSummary =
    ` totalAvgMs=${total.averageMs.toFixed(3)} totalP95Ms=${total.p95Ms.toFixed(3)}` +
    ` buildAvgMs=${build.averageMs.toFixed(3)} buildP95Ms=${build.p95Ms.toFixed(3)}` +
    ` renderAvgMs=${render.averageMs.toFixed(3)} renderP95Ms=${render.p95Ms.toFixed(3)}` +
    ` buildShareAvgPct=${result.derived.buildSharePctAvg.toFixed(1)}` +
    ` renderShareAvgPct=${result.derived.renderSharePctAvg.toFixed(1)}`

  return `framework=${result.framework} scenario=${result.scenario} iters=${total.count} elapsedMs=${result.elapsedMs}${phaseSummary}${memSummary}`
}

function writeLine(line: string): void {
  realStdoutWrite(`${line}\n`)
}
