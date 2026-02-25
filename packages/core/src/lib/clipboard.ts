// OSC 52 clipboard support for terminal applications.
// Delegates to native Zig implementation for ANSI sequence generation.

import type { Pointer } from "bun:ffi"
import type { RenderLib } from "../zig"

type ClipboardCommandResult = {
  success: boolean
  output: string
}

export type ClipboardCommandRunner = (command: string[], input?: string) => ClipboardCommandResult

export enum ClipboardTarget {
  Clipboard = 0,
  Primary = 1,
  Secondary = 2,
  Query = 3,
}

export function encodeOsc52Payload(text: string, encoder: TextEncoder = new TextEncoder()): Uint8Array {
  const base64 = Buffer.from(text).toString("base64")
  return encoder.encode(base64)
}

function runClipboardCommand(command: string[], input?: string): ClipboardCommandResult {
  try {
    const subprocess = Bun.spawnSync({
      cmd: command,
      stdin: input ?? undefined,
      stdout: "pipe",
      stderr: "pipe",
    })

    const ok = subprocess.exitCode === 0 && subprocess.signalCode === null
    const output = ok ? new TextDecoder().decode(subprocess.stdout) : ""
    return { success: ok, output }
  } catch {
    return { success: false, output: "" }
  }
}

export function getSystemClipboardWriteCommands(platform: NodeJS.Platform = process.platform): string[][] {
  if (platform === "win32") {
    return [
      ["powershell", "-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard"],
      ["pwsh", "-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard"],
      ["clip.exe"],
      ["clip"],
    ]
  }

  if (platform === "darwin") {
    return [["pbcopy"]]
  }

  return [
    ["wl-copy"],
    ["xclip", "-selection", "clipboard"],
    ["xsel", "--clipboard", "--input"],
  ]
}

export function getSystemClipboardReadCommands(platform: NodeJS.Platform = process.platform): string[][] {
  if (platform === "win32") {
    return [
      ["powershell", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"],
      ["pwsh", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"],
    ]
  }

  if (platform === "darwin") {
    return [["pbpaste"]]
  }

  return [
    ["wl-paste", "--no-newline"],
    ["xclip", "-selection", "clipboard", "-out"],
    ["xsel", "--clipboard", "--output"],
  ]
}

export class Clipboard {
  private lib: RenderLib
  private rendererPtr: Pointer
  private commandRunner: ClipboardCommandRunner

  constructor(lib: RenderLib, rendererPtr: Pointer, commandRunner: ClipboardCommandRunner = runClipboardCommand) {
    this.lib = lib
    this.rendererPtr = rendererPtr
    this.commandRunner = commandRunner
  }

  public copyToClipboardOSC52(text: string, target: ClipboardTarget = ClipboardTarget.Clipboard): boolean {
    if (!this.isOsc52Supported()) {
      return false
    }
    const payload = encodeOsc52Payload(text, this.lib.encoder)
    return this.lib.copyToClipboardOSC52(this.rendererPtr, target, payload)
  }

  public clearClipboardOSC52(target: ClipboardTarget = ClipboardTarget.Clipboard): boolean {
    if (!this.isOsc52Supported()) {
      return false
    }
    return this.lib.clearClipboardOSC52(this.rendererPtr, target)
  }

  public isOsc52Supported(): boolean {
    const caps = this.lib.getTerminalCapabilities(this.rendererPtr)
    return Boolean(caps?.osc52)
  }

  public copyToSystemClipboard(text: string, platform: NodeJS.Platform = process.platform): boolean {
    const commands = getSystemClipboardWriteCommands(platform)
    for (const command of commands) {
      const result = this.commandRunner(command, text)
      if (result.success) {
        return true
      }
    }
    return false
  }

  public readFromSystemClipboard(platform: NodeJS.Platform = process.platform): string | null {
    const commands = getSystemClipboardReadCommands(platform)
    for (const command of commands) {
      const result = this.commandRunner(command)
      if (result.success) {
        return result.output
      }
    }
    return null
  }

  public copyToBestAvailable(text: string, target: ClipboardTarget = ClipboardTarget.Clipboard): boolean {
    return this.copyToClipboardOSC52(text, target) || this.copyToSystemClipboard(text)
  }
}
