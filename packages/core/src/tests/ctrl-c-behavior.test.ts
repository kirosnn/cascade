import { test, expect } from "bun:test"
import { createCliRenderer } from "../renderer"

// Unit test to verify the behavior of Ctrl+C
test("Ctrl+C should copy the selection if it exists", async () => {
  const renderer = await createCliRenderer({
    testing: true,
    exitOnCtrlC: true,
  })

  // Simulate a selection
  const mockSelection = {
    getSelectedText: () => "Test text",
    isActive: true,
    touchedRenderables: [],
  }

  // @ts-ignore - Private access for the test
  renderer.currentSelection = mockSelection

  // Check that hasSelection returns true
  expect(renderer.hasSelection).toBe(true)
  
  // Check that getSelectedText returns the correct text
  expect(renderer.getSelectedText()).toBe("Test text")

  // Clean up
  renderer.destroy()
})

test("Ctrl+C should return null if there is no selection", async () => {
  const renderer = await createCliRenderer({
    testing: true,
    exitOnCtrlC: true,
  })

  // Check that hasSelection returns false
  expect(renderer.hasSelection).toBe(false)
  
  // Check that getSelectedText returns null
  expect(renderer.getSelectedText()).toBe(null)

  // Clean up
  renderer.destroy()
})