import { render } from "@cascade/solid"
import { ConsolePosition } from "@cascade/core"
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
