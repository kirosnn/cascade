import { test, expect } from "bun:test"
import { createCliRenderer } from "../renderer"
import { Selection } from "../lib/selection"

// Integration test to verify the complete behavior of Ctrl+C
test("copySelection() should copy and clear the selection", async () => {
  const renderer = await createCliRenderer({
    testing: true,
    exitOnCtrlC: true,
  })

  // Create a real selection
  const mockRenderable = {
    x: 0,
    y: 0,
    isDestroyed: false,
    selectable: true,
    getSelectedText: () => "Selected text",
    onSelectionChanged: () => {},
  }

  const selection = new Selection(mockRenderable as any, { x: 0, y: 0 }, { x: 5, y: 0 })
  selection.updateSelectedRenderables([mockRenderable] as any)

  // @ts-ignore - Private access for the test
  renderer.currentSelection = selection

  // Check that the selection exists
  expect(renderer.hasSelection).toBe(true)
  expect(renderer.getSelectedText()).toBe("Selected text")

  // Mock the copyToClipboard function to avoid system dependencies
  let clipboardContent = ""
  const originalCopyToClipboard = renderer.copyToClipboard
  renderer.copyToClipboard = (text: string) => {
    clipboardContent = text
    return true
  }

  // Test copySelection
  const result = renderer.copySelection()
  
  expect(result).toBe(true)
  expect(clipboardContent).toBe("Selected text")
  expect(renderer.hasSelection).toBe(false) // The selection should be cleared

  // Clean up
  renderer.destroy()
})

test("copySelection() should return false if there is no selection", async () => {
  const renderer = await createCliRenderer({
    testing: true,
    exitOnCtrlC: true,
  })

  // Check that there is no selection
  expect(renderer.hasSelection).toBe(false)

  // Test copySelection without selection
  const result = renderer.copySelection()
  
  expect(result).toBe(false)

  // Clean up
  renderer.destroy()
})