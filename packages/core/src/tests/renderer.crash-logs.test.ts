import { afterEach, beforeEach, expect, mock, test } from "bun:test"
import { createTestRenderer, type TestRenderer } from "../testing/test-renderer"

let renderer: TestRenderer

beforeEach(async () => {
  ;({ renderer } = await createTestRenderer({}))
})

afterEach(() => {
  renderer.destroy()
})

test("stores crash reports with recent runtime events", async () => {
  renderer.stdin.emit("data", Buffer.from("a"))
  await Bun.sleep(15)

  const report = renderer.reportCrash(new Error("boom"), "test-case", {
    phase: "unit-test",
  })

  expect(report.source).toBe("test-case")
  expect(report.message).toBe("boom")
  expect(report.recentEvents.length).toBeGreaterThan(0)
  expect(report.recentEvents.some((entry) => entry.type === "input:data")).toBe(true)

  const stored = renderer.getCrashReports()
  expect(stored.length).toBe(1)
  expect(stored[0]?.message).toBe("boom")
})

test("logs detailed crash report to console when enabled", async () => {
  const originalConsoleError = console.error
  const consoleErrorMock = mock(() => {})
  console.error = consoleErrorMock

  try {
    const setup = await createTestRenderer({ logCrashReportsToConsole: true })
    const crashRenderer = setup.renderer
    crashRenderer.reportCrash(new Error("detailed-boom"), "test-logging", { phase: "log-test" })

    expect(consoleErrorMock).toHaveBeenCalled()
    const firstCall = consoleErrorMock.mock.calls[0]
    expect(firstCall?.[0]).toContain("[Cascade Crash Report]")
    expect(firstCall?.[0]).toContain("source=test-logging")
    expect(firstCall?.[0]).toContain("message=detailed-boom")

    crashRenderer.destroy()
  } finally {
    console.error = originalConsoleError
  }
})
