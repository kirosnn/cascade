import { describe, expect, it } from "bun:test"
import React from "react"
import { createTestRenderer } from "@cascadetui/core/testing"
import { createRoot } from "../src/reconciler/renderer"

describe("React crash logs", () => {
  it("reports React boundary errors to renderer crash logs", async () => {
    const testSetup = await createTestRenderer({
      width: 40,
      height: 20,
    })

    const root = createRoot(testSetup.renderer)

    function BrokenComponent() {
      throw new Error("react-crash")
    }

    root.render(<BrokenComponent />)

    await Bun.sleep(20)

    const reports = testSetup.renderer.getCrashReports()
    expect(reports.length).toBeGreaterThan(0)
    expect(reports.some((report) => report.source === "react-error-boundary" && report.message === "react-crash")).toBe(
      true,
    )

    testSetup.renderer.destroy()
  })
})

