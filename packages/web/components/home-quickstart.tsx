"use client"

import { useMemo, useState } from "react"

type QuickstartMode = "skill" | "manual" | "create"

const QUICKSTART_COMMANDS: Record<QuickstartMode, string> = {
  skill: "npx create-cascade-skill --help",
  manual: "bun add @cascadetui/core",
  create: "bun create cascade",
}

export function HomeQuickstart() {
  const [mode, setMode] = useState<QuickstartMode>("skill")
  const [copied, setCopied] = useState(false)

  const command = useMemo(() => QUICKSTART_COMMANDS[mode], [mode])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section className="home-quickstart" aria-label="Quickstart commands">
      <div className="quickstart-head">
        <h2>Quickstart</h2>
        <p>Create powerful, interactive terminal user interfaces using TypeScript bindings, seamless support for React and Solid, and a C-compatible ABI that enables integration with virtually any programming language.</p>
        <p>Use the commands below to get started. Support for Node and Deno is in progress.</p>
      </div>

      <div className="quickstart-card">
        <div className="quickstart-header" role="tablist" aria-label="Quickstart mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "create"}
            className="quickstart-tab"
            onClick={() => setMode("create")}
          >
            create
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "manual"}
            className="quickstart-tab"
            onClick={() => setMode("manual")}
          >
            manual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "skill"}
            className="quickstart-tab"
            onClick={() => setMode("skill")}
          >
            skill
          </button>
        </div>

        <div className="quickstart-content" aria-live="polite">
          <code>{command}</code>

          <button
            type="button"
            className={`copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            aria-label="Copy code"
          >
            <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
