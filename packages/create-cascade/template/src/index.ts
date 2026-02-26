import { createCliRenderer, TextRenderable } from "@cascadetui/core"

const renderer = createCliRenderer()

const app = new TextRenderable({
  content: "Hello from Cascade",
  x: 2,
  y: 1,
})

renderer.root.add(app)
renderer.start()
