import React from "react"

export class ErrorBoundary extends React.Component<
  { children?: React.ReactNode; onCrash?: (error: Error, info: React.ErrorInfo) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children?: React.ReactNode; onCrash?: (error: Error, info: React.ErrorInfo) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): {
    hasError: boolean
    error: Error
  } {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onCrash?.(error, info)
  }

  override render(): any {
    if (this.state.hasError && this.state.error) {
      return (
        <box style={{ flexDirection: "column", padding: 2 }}>
          <text fg="red" content={this.state.error.stack || this.state.error.message} />
        </box>
      )
    }

    return this.props.children
  }
}
