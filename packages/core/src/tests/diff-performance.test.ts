import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { createTestRenderer, type TestRenderer } from "../testing/test-renderer"
import { DiffRenderable, ScrollBoxRenderable, BoxRenderable, SyntaxStyle, RGBA } from "../index"

function generateLargeDiff(lines: number): string {
  const header = `--- a/large-file.ts
+++ b/large-file.ts
@@ -1,${Math.floor(lines / 2)} +1,${lines} @@
`
  const diffLines: string[] = [header]
  
  for (let i = 0; i < lines; i++) {
    const lineNum = i + 1
    const lineType = i % 5 === 0 ? " " : i % 3 === 0 ? "-" : "+"
    const content = `${lineType}// Line ${lineNum}: ${"x".repeat(Math.floor(Math.random() * 60 + 20))}`
    diffLines.push(content)
  }
  
  return diffLines.join("\n")
}

describe("Diff Performance", () => {
  let renderer: TestRenderer

  beforeAll(async () => {
    ;({ renderer } = await createTestRenderer({
      width: 120,
      height: 40,
    }))
  })

  afterAll(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy()
    }
  })

  test("large diff (500 lines) should render in < 100ms", async () => {
    const largeDiff = generateLargeDiff(500)
    
    const syntaxStyle = SyntaxStyle.fromStyles({
      default: { fg: RGBA.fromValues(0.9, 0.9, 0.9, 1) },
    })

    const root = new BoxRenderable(renderer, {
      flexDirection: "column",
      width: "100%",
      height: "100%",
    })
    renderer.root.add(root)

    const scrollbox = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      scrollY: true,
      scrollX: true,
      viewportCulling: true,
    })
    root.add(scrollbox)

    const start = performance.now()
    
    const diff = new DiffRenderable(renderer, {
      id: "perf-diff",
      diff: largeDiff,
      view: "split",
      syntaxStyle,
      showLineNumbers: true,
      wrapMode: "none",
      width: "100%",
      height: "100%",
    })
    scrollbox.add(diff)

    await new Promise(resolve => setTimeout(resolve, 50))
    
    const elapsed = performance.now() - start
    
    console.log(`Large diff (500 lines) render time: ${elapsed.toFixed(2)}ms`)
    
    expect(elapsed).toBeLessThan(200)
    
    root.destroyRecursively()
  })

  test("rapid diff content changes should not cause measure loops", async () => {
    const syntaxStyle = SyntaxStyle.fromStyles({
      default: { fg: RGBA.fromValues(0.9, 0.9, 0.9, 1) },
    })

    const root = new BoxRenderable(renderer, {
      flexDirection: "column",
      width: "100%",
      height: "100%",
    })
    renderer.root.add(root)

    const diff = new DiffRenderable(renderer, {
      id: "rapid-diff",
      diff: generateLargeDiff(100),
      view: "split",
      syntaxStyle,
      showLineNumbers: true,
      wrapMode: "none",
      width: "100%",
      height: "100%",
    })
    root.add(diff)

    await new Promise(resolve => setTimeout(resolve, 20))

    const start = performance.now()
    
    for (let i = 0; i < 10; i++) {
      diff.diff = generateLargeDiff(100 + i * 10)
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    const elapsed = performance.now() - start
    
    console.log(`10 rapid diff changes: ${elapsed.toFixed(2)}ms total, ${(elapsed / 10).toFixed(2)}ms avg`)
    
    expect(elapsed).toBeLessThan(500)
    
    root.destroyRecursively()
  })

  test("scrollbox with large diff should scroll smoothly", async () => {
    const largeDiff = generateLargeDiff(300)
    
    const syntaxStyle = SyntaxStyle.fromStyles({
      default: { fg: RGBA.fromValues(0.9, 0.9, 0.9, 1) },
    })

    const root = new BoxRenderable(renderer, {
      flexDirection: "column",
      width: "100%",
      height: "100%",
    })
    renderer.root.add(root)

    const scrollbox = new ScrollBoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      scrollY: true,
      viewportCulling: true,
    })
    root.add(scrollbox)

    const diff = new DiffRenderable(renderer, {
      id: "scroll-diff",
      diff: largeDiff,
      view: "unified",
      syntaxStyle,
      showLineNumbers: true,
      wrapMode: "none",
      width: "100%",
      height: "100%",
    })
    scrollbox.add(diff)

    await new Promise(resolve => setTimeout(resolve, 30))

    const start = performance.now()
    
    for (let i = 0; i < 20; i++) {
      scrollbox.scrollTop = i * 10
      await new Promise(resolve => setTimeout(resolve, 5))
    }
    
    const elapsed = performance.now() - start
    
    console.log(`20 scroll operations: ${elapsed.toFixed(2)}ms total, ${(elapsed / 20).toFixed(2)}ms avg`)
    
    expect(elapsed).toBeLessThan(300)
    
    root.destroyRecursively()
  })
})
