import { describe, expect, it, afterEach } from "bun:test"
import { createTestRenderer, type TestRenderer } from "../testing/test-renderer"
import {
  Clipboard,
  ClipboardTarget,
  encodeOsc52Payload,
  getSystemClipboardReadCommands,
  getSystemClipboardWriteCommands,
  type ClipboardCommandRunner,
} from "./clipboard"
import type { RenderLib } from "../zig"

describe("clipboard", () => {
  let renderer: TestRenderer | null = null

  const enableOsc52 = (testRenderer: TestRenderer) => {
    const lib = (testRenderer as unknown as { lib: RenderLib }).lib
    lib.processCapabilityResponse(testRenderer.rendererPtr, "\x1bP>|kitty(0.40.1)\x1b\\")
  }

  afterEach(() => {
    renderer?.destroy()
    renderer = null
  })

  it("encodes payload as base64", () => {
    const payload = encodeOsc52Payload("hello")
    const decoded = new TextDecoder().decode(payload)
    expect(decoded).toBe(Buffer.from("hello").toString("base64"))
  })

  it("gates clipboard writes on OSC 52 support", async () => {
    ;({ renderer } = await createTestRenderer({ remote: true }))

    expect(renderer.isOsc52Supported()).toBe(false)
    expect(renderer.copyToClipboardOSC52("test")).toBe(false)
    expect(renderer.clearClipboardOSC52()).toBe(false)

    enableOsc52(renderer)

    expect(renderer.isOsc52Supported()).toBe(true)
    expect(renderer.copyToClipboardOSC52("test")).toBe(true)
    expect(renderer.copyToClipboardOSC52("test", ClipboardTarget.Primary)).toBe(true)
    expect(renderer.copyToClipboardOSC52("test", ClipboardTarget.Secondary)).toBe(true)
    expect(renderer.copyToClipboardOSC52("test", ClipboardTarget.Query)).toBe(true)
    expect(renderer.clearClipboardOSC52()).toBe(true)
  })

  it("returns expected system write commands for each OS", () => {
    expect(getSystemClipboardWriteCommands("win32")).toEqual([
      ["powershell", "-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard"],
      ["pwsh", "-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard"],
      ["clip.exe"],
      ["clip"],
    ])

    expect(getSystemClipboardWriteCommands("darwin")).toEqual([["pbcopy"]])

    expect(getSystemClipboardWriteCommands("linux")).toEqual([
      ["wl-copy"],
      ["xclip", "-selection", "clipboard"],
      ["xsel", "--clipboard", "--input"],
    ])
  })

  it("returns expected system read commands for each OS", () => {
    expect(getSystemClipboardReadCommands("win32")).toEqual([
      ["powershell", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"],
      ["pwsh", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"],
    ])

    expect(getSystemClipboardReadCommands("darwin")).toEqual([["pbpaste"]])

    expect(getSystemClipboardReadCommands("linux")).toEqual([
      ["wl-paste", "--no-newline"],
      ["xclip", "-selection", "clipboard", "-out"],
      ["xsel", "--clipboard", "--output"],
    ])
  })

  it("tries system clipboard commands with fallback order", async () => {
    ;({ renderer } = await createTestRenderer({ remote: true }))

    const calls: Array<{ command: string[]; input?: string }> = []
    const runner: ClipboardCommandRunner = (command, input) => {
      calls.push({ command, input })
      if (command[0] === "xclip") {
        return { success: true, output: "" }
      }
      return { success: false, output: "" }
    }

    const clip = new Clipboard((renderer as unknown as { lib: RenderLib }).lib, renderer.rendererPtr, runner)
    const copied = clip.copyToSystemClipboard("hello", "linux")
    expect(copied).toBe(true)
    expect(calls.length).toBe(2)
    expect(calls[0]?.command[0]).toBe("wl-copy")
    expect(calls[1]?.command[0]).toBe("xclip")
    expect(calls[1]?.input).toBe("hello")
  })

  it("reads system clipboard using fallback order", async () => {
    ;({ renderer } = await createTestRenderer({ remote: true }))

    const runner: ClipboardCommandRunner = (command) => {
      if (command[0] === "pbpaste") {
        return { success: true, output: "clipboard text" }
      }
      return { success: false, output: "" }
    }

    const clip = new Clipboard((renderer as unknown as { lib: RenderLib }).lib, renderer.rendererPtr, runner)
    expect(clip.readFromSystemClipboard("darwin")).toBe("clipboard text")
  })

  it("prefers OSC52 then falls back to system clipboard", async () => {
    ;({ renderer } = await createTestRenderer({ remote: true }))
    const lib = (renderer as unknown as { lib: RenderLib }).lib

    const runner: ClipboardCommandRunner = () => ({ success: true, output: "" })
    const clip = new Clipboard(lib, renderer.rendererPtr, runner)

    expect(clip.copyToBestAvailable("hello")).toBe(true)
    expect(clip.isOsc52Supported()).toBe(false)

    enableOsc52(renderer)
    expect(clip.isOsc52Supported()).toBe(true)
    expect(clip.copyToBestAvailable("hello")).toBe(true)
  })
})
