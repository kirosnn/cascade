import { test, expect, beforeEach, afterEach } from "bun:test"
import { createTestRenderer, type TestRenderer } from "../testing/test-renderer"
import { TextRenderable } from "../renderables/Text"

let renderer: TestRenderer
let renderOnce: () => Promise<void>

beforeEach(async () => {
  ;({ renderer, renderOnce } = await createTestRenderer({}))
})

afterEach(() => {
  renderer.destroy()
})

test("selection on destroyed renderable should not throw", async () => {
  const text = new TextRenderable(renderer, {
    content: "Hello World",
    width: 20,
    height: 1,
  })

  renderer.root.add(text)
  await renderOnce()

  // Start selection
  renderer.startSelection(text, 0, 0)

  // Update selection - this should not throw
  renderer.updateSelection(text, 5, 1)

  expect(renderer.getSelection()).not.toBeNull()

  // Destroy the text renderable
  text.destroy()

  expect(text.isDestroyed).toBe(true)

  // Get selection - this should not throw
  expect(renderer.getSelection()!.getSelectedText()).toBe("")

  // Update selection - this should not throw
  renderer.updateSelection(text, 8, 1)

  // Clear selection - this should not throw
  renderer.clearSelection()

  expect(renderer.getSelection()).toBeNull()
})

test("renderer.selectWord selects the word at coordinates", async () => {
  const text = new TextRenderable(renderer, {
    content: "hello world",
    width: 20,
    height: 1,
  })

  renderer.root.add(text)
  await renderOnce()

  renderer.selectWord(text.x + 1, text.y)

  expect(renderer.getSelection()).not.toBeNull()
  expect(renderer.getSelection()!.getSelectedText()).toBe("hello")
})

test("renderer.selectLine selects the full visual line", async () => {
  const text = new TextRenderable(renderer, {
    content: "hello world\nsecond line",
    width: 30,
    height: 2,
    wrapMode: "none",
  })

  renderer.root.add(text)
  await renderOnce()

  renderer.selectLine(text.x + 1, text.y + 1)

  expect(renderer.getSelection()).not.toBeNull()
  expect(renderer.getSelection()!.getSelectedText()).toBe("second line")
})

test("renderer.updateSelectionWordSnap extends selection to word boundary", async () => {
  const text = new TextRenderable(renderer, {
    content: "hello world test",
    width: 30,
    height: 1,
    wrapMode: "none",
  })

  renderer.root.add(text)
  await renderOnce()

  renderer.selectWord(text.x + 1, text.y)
  renderer.updateSelectionWordSnap(text.x + 7, text.y)

  expect(renderer.getSelection()).not.toBeNull()
  expect(renderer.getSelection()!.getSelectedText()).toBe("hello world")
})
