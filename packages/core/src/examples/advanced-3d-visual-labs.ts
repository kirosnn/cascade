#!/usr/bin/env bun

import { existsSync } from "node:fs"
import path from "node:path"
import { BoxRenderable, CliRenderer, RGBA, TextRenderable, createCliRenderer, type KeyEvent } from "../index"
import { ThreeRenderable, createShowcaseScene } from "../3d"

interface VisualTestState {
  renderer: CliRenderer
  panel: BoxRenderable
  title: TextRenderable
  info: TextRenderable
  modeText: TextRenderable
  three: ThreeRenderable
  useRail: boolean
  running: boolean
}

function resolveWebGpuLibPath(): string | undefined {
  const fromEnv = process.env.BUN_WEBGPU_LIB_PATH
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv
  }

  const repoRoot = path.resolve(import.meta.dir, "..", "..", "..")
  const labsLib = path.resolve(repoRoot, ".labs", "webgpu")
  if (existsSync(labsLib)) {
    return labsLib
  }

  return undefined
}

function hasRequiredDxcDlls(libPath: string | undefined): boolean {
  if (process.platform !== "win32") {
    return true
  }
  if (!libPath) {
    return false
  }

  const dxcompiler = path.resolve(libPath, "dxcompiler.dll")
  const dxil = path.resolve(libPath, "dxil.dll")
  return existsSync(dxcompiler) && existsSync(dxil)
}

function createOverlay(renderer: CliRenderer): { panel: BoxRenderable; title: TextRenderable; info: TextRenderable; modeText: TextRenderable } {
  const panel = new BoxRenderable(renderer, {
    id: "labs-advanced-3d-overlay",
    position: "absolute",
    left: 1,
    top: 1,
    width: Math.max(46, Math.floor(renderer.terminalWidth * 0.58)),
    height: 4,
    border: true,
    borderStyle: "single",
    borderColor: "#7C8FB3",
    backgroundColor: "#0B1220",
    zIndex: 300,
  })
  const title = new TextRenderable(renderer, {
    id: "labs-advanced-3d-title",
    content: "Labs Visual 3D Test: Showcase Scene",
    position: "absolute",
    left: 2,
    top: 1,
    fg: "#E2E8F0",
    zIndex: 301,
  })
  const info = new TextRenderable(renderer, {
    id: "labs-advanced-3d-info",
    content: "R: rail/orbit | Arrows: orbit | Z/X: zoom | P: screenshot | Esc: quit",
    position: "absolute",
    left: 2,
    top: 2,
    fg: "#94A3B8",
    zIndex: 301,
  })
  const modeText = new TextRenderable(renderer, {
    id: "labs-advanced-3d-mode",
    content: "Camera Mode: Rail",
    position: "absolute",
    left: 2,
    top: 3,
    fg: "#FBBF24",
    zIndex: 301,
  })

  panel.add(title)
  panel.add(info)
  panel.add(modeText)
  renderer.root.add(panel)

  return { panel, title, info, modeText }
}

function shutdown(state: VisualTestState, exitCode: number): void {
  if (!state.running) return
  state.running = false
  state.renderer.clearFrameCallbacks()
  if (!state.three.isDestroyed) state.three.destroy()
  if (!state.panel.isDestroyed) state.panel.destroy()
  state.renderer.destroy()
  process.exit(exitCode)
}

async function main(): Promise<void> {
  const webgpuLibPath = resolveWebGpuLibPath()
  const windowsDxcReady = hasRequiredDxcDlls(webgpuLibPath)

  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 60,
  })

  renderer.start()
  renderer.setBackgroundColor("#05070B")

  const showcase = createShowcaseScene({
    instanceCount: 12000,
    worldExtent: [180, 28, 180],
    seed: 42,
  })

  const { panel, title, info, modeText } = createOverlay(renderer)

  if (process.platform === "win32" && !windowsDxcReady) {
    info.content = "Missing DXC: put dxcompiler.dll + dxil.dll in .labs/webgpu, then rerun."
  }

  const three = new ThreeRenderable(renderer, {
    id: "labs-advanced-3d-main",
    position: "absolute",
    left: 0,
    top: 0,
    width: renderer.terminalWidth,
    height: renderer.terminalHeight,
    zIndex: 100,
    scene: showcase.scene,
    camera: showcase.camera,
    renderer: {
      alpha: false,
      shadows: true,
      toneMappingExposure: 1.2,
      backgroundColor: RGBA.fromValues(0.02, 0.03, 0.05, 1),
      libPath: webgpuLibPath,
    },
  })
  renderer.root.add(three)

  const state: VisualTestState = {
    renderer,
    panel,
    title,
    info,
    modeText,
    three,
    useRail: true,
    running: true,
  }

  renderer.setFrameCallback(async (deltaMs) => {
    if (!state.running) return
    const dt = deltaMs / 1000
    showcase.update(dt)

    if (state.useRail) {
      showcase.rail.update(dt)
    } else {
      showcase.orbit.rotate(0.12 * dt, 0)
      showcase.orbit.update(dt)
    }
  })

  const handleResize = (width: number, _height: number) => {
    state.three.width = width
    state.three.height = renderer.terminalHeight
    state.panel.width = Math.max(46, Math.floor(width * 0.58))
  }

  const handleKey = (key: KeyEvent) => {
    if (key.name === "escape") {
      shutdown(state, 0)
      return
    }

    if (key.name === "r") {
      state.useRail = !state.useRail
      state.modeText.content = `Camera Mode: ${state.useRail ? "Rail" : "Orbit"}`
      return
    }

    if (key.name === "p") {
      const path = `.labs/advanced-3d-visual-${Date.now()}.png`
      void state.three.renderer.saveToFile(path)
      state.info.content = `Saved snapshot: ${path}`
      return
    }

    if (!state.useRail) {
      if (key.name === "left") showcase.orbit.rotate(-0.35, 0)
      if (key.name === "right") showcase.orbit.rotate(0.35, 0)
      if (key.name === "up") showcase.orbit.rotate(0, -0.18)
      if (key.name === "down") showcase.orbit.rotate(0, 0.18)
      if (key.name === "z") showcase.orbit.zoom(-1.2)
      if (key.name === "x") showcase.orbit.zoom(1.2)
    }
  }

  renderer.on("resize", handleResize)
  renderer.keyInput.on("keypress", handleKey)

  if (process.env.VISUAL_AUTO_SNAPSHOT === "1") {
    setTimeout(() => {
      if (!state.running) return
      const path = `.labs/advanced-3d-visual-auto-${Date.now()}.png`
      void state.three.renderer.saveToFile(path)
      state.info.content = `Saved snapshot: ${path}`
      setTimeout(() => shutdown(state, 0), 900)
    }, 2400)
  }

  process.on("SIGINT", () => shutdown(state, 0))
}

if (import.meta.main) {
  void main()
}
