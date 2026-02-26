import { createCliRenderer } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"

export const App = () => {
  return (
    <>
      <box flexDirection="row">
        <box border borderStyle="single">
          <text content="Single" />
        </box>
        <box border borderStyle="double">
          <text content="Double" />
        </box>
        <box border borderStyle="rounded">
          <text content="Rounded" />
        </box>
        <box border borderStyle="heavy">
          <text content="Heavy" />
        </box>
      </box>
    </>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
