import { CliRenderer, CliRenderEvents, engine } from "@cascadetui/core"
import React, { type ReactNode } from "react"
import type { OpaqueRoot } from "react-reconciler"
import { ConcurrentRoot } from "react-reconciler/constants"
import { AppContext } from "../components/app"
import { ErrorBoundary } from "../components/error-boundary"
import { reconciler } from "./reconciler"

// flushSync was renamed to flushSyncFromReconciler in react-reconciler 0.32.0
// the types for react-reconciler are not up to date with the library
const _r = reconciler as typeof reconciler & { flushSyncFromReconciler?: typeof reconciler.flushSync }
const flushSync = _r.flushSyncFromReconciler ?? _r.flushSync

export type Root = {
  render: (node: ReactNode) => void
  unmount: () => void
}

/**
 * Creates a root for rendering a React tree with the given CLI renderer.
 * @param renderer The CLI renderer to use
 * @returns A root object with a `render` method
 * @example
 * ```tsx
 * const renderer = await createCliRenderer()
 * createRoot(renderer).render(<App />)
 * ```
 */
export function createRoot(renderer: CliRenderer): Root {
  let container: OpaqueRoot | null = null

  const cleanup = () => {
    if (container) {
      reconciler.updateContainer(null, container, null, () => {})
      // @ts-expect-error the types for `react-reconciler` are not up to date with the library.
      reconciler.flushSyncWork()
      container = null
    }
  }

  renderer.once(CliRenderEvents.DESTROY, cleanup)

  return {
    render: (node: ReactNode) => {
      engine.attach(renderer)

      const element = React.createElement(
        AppContext.Provider,
        { value: { keyHandler: renderer.keyInput, renderer } },
        React.createElement(
          ErrorBoundary,
          {
            onCrash: (error, info) => {
              ;(renderer as any).reportCrash(error, "react-error-boundary", {
                componentStack: info.componentStack,
              })
            },
          },
          node,
        ),
      )

      if (!container) {
        container = reconciler.createContainer(
          renderer.root,
          ConcurrentRoot,
          null,
          false,
          null,
          "",
          console.error,
          console.error,
          console.error,
          console.error,
          null,
        )
      }

      reconciler.updateContainer(element, container, null, () => {})
    },

    unmount: cleanup,
  }
}

export { flushSync }
