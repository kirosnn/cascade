"use client"

import { useMemo, useState, type ReactNode } from "react"

type CodeLanguage = "bash" | "ts" | "tsx" | "js" | "jsx" | "json" | "text"

type CodeBlockProps = {
  code: string
  language?: CodeLanguage
}

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "await",
  "async",
  "import",
  "from",
  "export",
  "new",
  "class",
  "extends",
  "try",
  "catch",
  "throw",
  "type",
  "interface",
])

function highlightBash(code: string): ReactNode {
  const lines = code.split("\n")
  return lines.flatMap((line, lineIndex) => {
    const result: ReactNode[] = []
    const trimmed = line.trimStart()

    if (trimmed) {
      const leadingSpaces = line.slice(0, line.length - trimmed.length)
      const parts = trimmed.split(/\s+/)

      if (leadingSpaces) result.push(leadingSpaces)

      parts.forEach((part, partIndex) => {
        if (partIndex > 0) result.push(" ")
        if (partIndex === 0) {
          result.push(<span key={`${lineIndex}-${partIndex}`} className="token-command">{part}</span>)
        } else if (part.startsWith("-") || part.startsWith("--")) {
          result.push(<span key={`${lineIndex}-${partIndex}`} className="token-flag">{part}</span>)
        } else {
          result.push(<span key={`${lineIndex}-${partIndex}`} className="token-arg">{part}</span>)
        }
      })
    }

    if (lineIndex < lines.length - 1) result.push("\n")
    return result
  })
}

function highlightScript(code: string): ReactNode {
  const pattern =
    /\/\/.*$|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_$][\w$]*\b|=>|===|!==|==|!=|<=|>=|[+\-*/=(){}[\].,:;]/gm

  const nodes: ReactNode[] = []
  let cursor = 0
  let keyIndex = 0

  for (const match of code.matchAll(pattern)) {
    if (match.index === undefined) continue

    const index = match.index
    if (index > cursor) {
      nodes.push(code.slice(cursor, index))
    }

    const token = match[0]
    let className = "token-plain"

    if (token.startsWith("//")) {
      className = "token-comment"
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
      className = "token-string"
    } else if (/^\d/.test(token)) {
      className = "token-number"
    } else if (JS_KEYWORDS.has(token)) {
      className = "token-keyword"
    } else if (/^[a-zA-Z_$][\w$]*$/.test(token)) {
      className = "token-identifier"
    } else {
      className = "token-operator"
    }

    nodes.push(<span key={keyIndex++} className={className}>{token}</span>)
    cursor = index + token.length
  }

  if (cursor < code.length) {
    nodes.push(code.slice(cursor))
  }

  return nodes
}

function highlightCode(code: string, language: CodeLanguage): ReactNode {
  if (language === "bash") return highlightBash(code)
  if (language === "ts" || language === "tsx" || language === "js" || language === "jsx") {
    return highlightScript(code)
  }
  return code
}

export function CodeBlock({ code, language = "text" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const highlighted = useMemo(() => highlightCode(code, language), [code, language])

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="code-block">
      <button className={`copy-btn ${copied ? "copied" : ""}`} aria-label="Copy code" type="button" onClick={copy}>
        <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
      <pre>
        <code className={`language-${language}`}>{highlighted}</code>
      </pre>
    </div>
  )
}
