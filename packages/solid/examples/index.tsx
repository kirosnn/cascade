import { render } from "@cascadetui/solid"
import { ConsolePosition } from "@cascadetui/core"
import ExampleSelector from "./components/ExampleSelector"

// Uncomment to debug solidjs reconciler
// process.env.DEBUG = "true"

const App = () => <ExampleSelector />

render(App, {
  targetFps: 30,
  exitOnCtrlC: false,
  consoleOptions: {
    position: ConsolePosition.BOTTOM,
    maxStoredLogs: 1000,
    sizePercent: 40,
  },
})
