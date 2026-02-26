import { describe, expect, test } from "bun:test"
import { docPages } from "../lib/docs"
import { createSearchEngine } from "../lib/search"

describe("docs search", () => {
  test("returns core section on semantic match", () => {
    const engine = createSearchEngine(docPages)
    const results = engine.search("selectWord")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.pageId).toBe("core-api")
  })

  test("supports page qualifier", () => {
    const engine = createSearchEngine(docPages)
    const results = engine.search("page:react crash")
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((entry) => entry.pageId === "react")).toBe(true)
  })

  test("supports section qualifier", () => {
    const engine = createSearchEngine(docPages)
    const results = engine.search("section:selection")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.sectionId).toBe("selection")
  })

  test("supports in:title", () => {
    const engine = createSearchEngine(docPages)
    const results = engine.search("in:title lifecycle")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.sectionId).toBe("lifecycle")
  })
})
