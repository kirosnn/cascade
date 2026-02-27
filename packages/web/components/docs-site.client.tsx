"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useEffect, useReducer, useRef, useCallback, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { DocPage } from "@/lib/docs"
import { createSearchEngine, type SearchEntry } from "@/lib/search"

const SIDEBAR_SCROLL_KEY = "cascade-docs:sidebar-scroll"
const SECTION_TITLE_HIGHLIGHT_CLASS = "doc-section-title--highlight"

type SearchState = {
    query: string
    highlightedIndex: number
    isOpen: boolean
}

type SearchAction =
    | { type: "OPEN" }
    | { type: "CLOSE" }
    | { type: "SET_QUERY"; query: string }
    | { type: "SET_HIGHLIGHTED"; index: number }
    | { type: "MOVE_DOWN"; total: number }
    | { type: "MOVE_UP"; total: number }

function searchReducer(state: SearchState, action: SearchAction): SearchState {
    switch (action.type) {
        case "OPEN":
            return { ...state, isOpen: true }
        case "CLOSE":
            return { query: "", highlightedIndex: 0, isOpen: false }
        case "SET_QUERY":
            return { ...state, query: action.query, highlightedIndex: 0 }
        case "SET_HIGHLIGHTED":
            return { ...state, highlightedIndex: action.index }
        case "MOVE_DOWN":
            return { ...state, highlightedIndex: (state.highlightedIndex + 1) % action.total }
        case "MOVE_UP":
            return { ...state, highlightedIndex: (state.highlightedIndex - 1 + action.total) % action.total }
    }

    return state
}

type LayoutState = {
    mounted: boolean
    footerEl: HTMLElement | null
    isFooterVisible: boolean
    mainContentEl: HTMLElement | null
    docsBarStyle: React.CSSProperties
}

type LayoutAction =
    | { type: "MOUNTED" }
    | { type: "SET_FOOTER_EL"; el: HTMLElement | null }
    | { type: "SET_FOOTER_VISIBLE"; visible: boolean }
    | { type: "SET_MAIN_CONTENT_EL"; el: HTMLElement | null }
    | { type: "SET_DOCS_BAR_STYLE"; style: React.CSSProperties }

function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
    switch (action.type) {
        case "MOUNTED":
            return { ...state, mounted: true }
        case "SET_FOOTER_EL":
            return { ...state, footerEl: action.el }
        case "SET_FOOTER_VISIBLE":
            return { ...state, isFooterVisible: action.visible }
        case "SET_MAIN_CONTENT_EL":
            return { ...state, mainContentEl: action.el }
        case "SET_DOCS_BAR_STYLE":
            return { ...state, docsBarStyle: action.style }
    }
}

type SearchModalProps = {
    query: string
    highlightedIndex: number
    results: SearchEntry[]
    searchInputRef: React.RefObject<HTMLInputElement | null>
    onOverlayClick: (e: React.MouseEvent) => void
    onQueryChange: (query: string) => void
    onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
    onResultSelect: (entry: SearchEntry) => void
    onResultHover: (index: number) => void
}

function SearchModal({
    query,
    highlightedIndex,
    results,
    searchInputRef,
    onOverlayClick,
    onQueryChange,
    onKeyDown,
    onResultSelect,
    onResultHover,
}: SearchModalProps) {
    return createPortal(
        <div
            className="search-modal-overlay"
            role="presentation"
            onClick={onOverlayClick}
            onKeyDown={(e) => {
                if (e.key === "Escape") onOverlayClick(e as unknown as React.MouseEvent)
            }}
        >
            <div className="search-modal-content">
                <div className="search-modal-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        ref={searchInputRef}
                        className="search-modal-input"
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search documentation..."
                    />
                </div>
                {query.trim().length > 0 && (
                    <div className="search-modal-body">
                        {results.length === 0 ? (
                            <div className="search-modal-empty">No results found for "{query}".</div>
                        ) : (
                            results.map((entry, index) => (
                                <button
                                    type="button"
                                    key={`${entry.pageId}:${entry.sectionId}`}
                                    className={`search-item ${index === highlightedIndex ? "active" : ""}`}
                                    onMouseEnter={() => onResultHover(index)}
                                    onClick={() => onResultSelect(entry)}
                                >
                                    <div className="search-title">{entry.pageTitle} - {entry.sectionTitle}</div>
                                    <div className="search-meta">{entry.preview}</div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}

type DocsSidebarProps = {
    groupedPages: Record<string, DocPage[]>
    pathname: string
    sidebarRef: React.RefObject<HTMLElement | null>
    onScroll: () => void
    onLinkClick: () => void
}

function DocsSidebar({ groupedPages, pathname, sidebarRef, onScroll, onLinkClick }: DocsSidebarProps) {
    return (
        <aside
            className="sidebar"
            ref={(node) => { sidebarRef.current = node }}
            onScroll={onScroll}
        >
            {Object.entries(groupedPages).map(([group, groupItems]) => (
                <section className="side-group" key={group}>
                    <h3 className="side-title">{group}</h3>
                    {groupItems.map((page) => {
                        const isActive = pathname === `/docs/${page.id}`
                        return (
                            <Link
                                className={`side-link ${isActive ? "active" : ""}`}
                                href={`/docs/${page.id}`}
                                key={page.id}
                                onClick={onLinkClick}
                            >
                                {page.title}
                            </Link>
                        )
                    })}
                </section>
            ))}
        </aside>
    )
}

type DocsBottomBarProps = {
    isFooterVisible: boolean
    docsBarStyle: React.CSSProperties
}

type ChatMessage = {
    role: "system" | "user" | "assistant" | "tool"
    content: string
    id?: string
    toolId?: string
    toolName?: string
    toolArgs?: string
}

function DocsBottomBar({ isFooterVisible, docsBarStyle }: DocsBottomBarProps) {
    const [value, setValue] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const canSend = value.trim().length > 0 && !isSending
    const formRef = useRef<HTMLFormElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const popoverRef = useRef<HTMLDivElement | null>(null)
    const cardRef = useRef<HTMLFormElement | null>(null)

    const onTextareaFocus = () => {
        const shouldOpen = value.trim().length > 0 || messages.length > 0
        if (shouldOpen) setIsPopoverOpen(true)
    }

    const clearConversation = () => {
        setMessages([])
        setIsPopoverOpen(false)
    }

    const parseSseLine = (line: string) => {
        const trimmed = line.trimEnd()
        if (!trimmed) return null
        if (trimmed.startsWith("event:")) return { kind: "event", value: trimmed.slice("event:".length).trim() }
        if (trimmed.startsWith("data:")) return { kind: "data", value: trimmed.slice("data:".length).trim() }
        return null
    }

    const formatToolArgs = (raw: string) => {
        try {
            const parsed = JSON.parse(raw) as unknown
            return JSON.stringify(parsed, null, 2)
        } catch {
            return raw
        }
    }

    const formatToolCall = (name: string, rawArgs: string) => {
        const parsed = (() => {
            try {
                return JSON.parse(rawArgs) as { query?: unknown }
            } catch {
                return null
            }
        })()

        const query = typeof parsed?.query === "string" ? parsed.query : ""
        const prettyName = name === "search_docs" ? "Search in Documentation" : name === "search_github" ? "Search on GitHub" : name
        const safeQuery = query ? JSON.stringify(query) : "\"\""
        return `${prettyName}(${safeQuery})`
    }

    useEffect(() => {
        setMessages([])
    }, [])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "i" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                setIsPopoverOpen((prev) => {
                    const next = !prev
                    if (next) {
                        setTimeout(() => textareaRef.current?.focus(), 0)
                    }
                    return next
                })
            }

            if (e.key === "Escape") {
                setIsPopoverOpen(false)
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!isPopoverOpen) return
            const target = e.target as Node | null
            if (!target) return
            if (popoverRef.current?.contains(target)) return
            if (cardRef.current?.contains(target)) return
            setIsPopoverOpen(false)
        }

        window.addEventListener("pointerdown", onPointerDown)
        return () => window.removeEventListener("pointerdown", onPointerDown)
    }, [isPopoverOpen])

    useEffect(() => {
        if (!isPopoverOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [isPopoverOpen])

    const onTextareaKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") return
        if (e.shiftKey) return
        e.preventDefault()
        if (!canSend) return
        formRef.current?.requestSubmit()
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSend) return

        setIsSending(true)
        setIsPopoverOpen(true)

        const userText = value.trim()
        setValue("")

        const userId = `${Date.now()}-${Math.random().toString(16).slice(2)}`

        const nextMessages: ChatMessage[] = [
            ...messages.filter((m) => m.role !== "system"),
            { id: userId, role: "user", content: userText },
        ]

        setMessages(nextMessages)
        try {
            const outboundMessages = nextMessages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((m) => ({ role: m.role, content: m.content }))

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: outboundMessages }),
            })

            if (!response.ok) {
                const raw = await response.text().catch(() => "")
                let data: { error?: string }
                try {
                    data = raw ? (JSON.parse(raw) as { error?: string }) : {}
                } catch {
                    data = { error: raw || "Request failed" }
                }
                setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Request failed" }])
                return
            }

            if (!response.body) {
                setMessages((prev) => [...prev, { role: "assistant", content: "Invalid response" }])
                return
            }

            const assistantId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""
            let currentEvent: string | null = null
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })

                const parts = buffer.split("\n")
                buffer = parts.pop() ?? ""

                for (const raw of parts) {
                    const parsed = parseSseLine(raw)
                    if (!parsed) continue

                    if (parsed.kind === "event") {
                        currentEvent = parsed.value
                        continue
                    }

                    if (parsed.kind === "data") {
                        const evt = currentEvent ?? "message"
                        currentEvent = null

                        if (evt === "content") {
                            let text: unknown
                            try {
                                text = JSON.parse(parsed.value)
                            } catch {
                                text = parsed.value
                            }
                            if (typeof text === "string" && text.length > 0) {
                                setMessages((prev) => {
                                    const idx = prev.findIndex((m) => m.id === assistantId)
                                    if (idx === -1) return prev
                                    const next = [...prev]
                                    const current = next[idx]
                                    if (!current || current.role !== "assistant") return prev
                                    next[idx] = { ...current, role: "assistant", content: current.content + text }
                                    return next
                                })
                            }
                            continue
                        }

                        if (evt === "tool_call") {
                            const payload = (() => {
                                try {
                                    return JSON.parse(parsed.value) as { id?: string; name?: string; arguments?: string }
                                } catch {
                                    return null
                                }
                            })()
                            const id = payload?.id
                            const name = payload?.name
                            const args = payload?.arguments
                            if (typeof id === "string" && typeof name === "string" && typeof args === "string") {
                                setMessages((prev) => {
                                    if (prev.some((m) => m.role === "tool" && m.toolId === id)) return prev

                                    const toolMsg: ChatMessage = {
                                        id: `${assistantId}:${id}`,
                                        role: "tool",
                                        content: "",
                                        toolId: id,
                                        toolName: formatToolCall(name, args),
                                    }

                                    const insertAt = prev.findIndex((m) => m.id === assistantId)
                                    if (insertAt === -1) return [...prev, toolMsg]
                                    const next = [...prev]
                                    next.splice(insertAt, 0, toolMsg)
                                    return next
                                })
                            }
                            continue
                        }

                        if (evt === "tool_result") {
                            continue
                        }

                        if (evt === "error") {
                            const payload = (() => {
                                try {
                                    return JSON.parse(parsed.value) as { error?: string; details?: string }
                                } catch {
                                    return null
                                }
                            })()

                            const msg = payload?.details ? `${payload.error ?? "Error"}\n${payload.details}` : payload?.error ?? "Error"
                            setMessages((prev) => {
                                const idx = prev.findIndex((m) => m.id === assistantId)
                                if (idx === -1) return [...prev, { id: assistantId, role: "assistant", content: msg }]
                                const next = [...prev]
                                const current = next[idx]
                                next[idx] = { ...current, role: "assistant", content: msg }
                                return next
                            })
                            continue
                        }

                        if (evt === "done") {
                            continue
                        }
                    }
                }
            }
        } catch (err) {
            setMessages((prev) => [...prev, { role: "assistant", content: err instanceof Error ? err.message : "Request failed" }])
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className={`docs-bottom-bar ${isFooterVisible ? "is-hidden" : ""}`} style={docsBarStyle}>
            <div className="chat-assistant-shell">
                <div className="chat-assistant-bar-actions">
                    <button type="button" className="copy-btn" aria-label="Clear conversation" onClick={clearConversation}>
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M6 6l1 16h10l1-16" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                        </svg>
                    </button>
                </div>
                <div className="chat-assistant-floating-input">
                    <div className="chat-assistant-overlay">
                        {isPopoverOpen ? (
                            <div ref={popoverRef} className="chat-assistant-popover" role="dialog" aria-label="Chat assistant">
                                <div className="chat-assistant-popover-inner">
                                    <div className="chat-assistant-conversation">
                                        {messages.map((m, idx) => (
                                            <div
                                                key={m.id ?? idx}
                                                className={`chat-assistant-msg ${m.role === "user"
                                                        ? "chat-assistant-msg-user"
                                                        : m.role === "tool"
                                                            ? "chat-assistant-msg-tool"
                                                            : "chat-assistant-msg-assistant"
                                                    }`}
                                            >
                                                <div
                                                    className={`chat-assistant-bubble ${m.role === "user"
                                                            ? "chat-assistant-bubble-user"
                                                            : m.role === "tool"
                                                                ? "chat-assistant-bubble-tool"
                                                                : "chat-assistant-bubble-assistant"
                                                        }`}
                                                >
                                                    {m.role === "assistant" ? (
                                                        <div className="chat-assistant-markdown">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                                        </div>
                                                    ) : m.role === "tool" ? (
                                                        <div className="chat-assistant-tool-inline">
                                                            <div className="chat-assistant-tool-inline-name">  • {m.toolName}</div>
                                                        </div>
                                                    ) : (
                                                        m.content
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isSending ? (
                                            <div className="chat-assistant-msg chat-assistant-msg-assistant">
                                                <div className="chat-assistant-bubble chat-assistant-bubble-assistant">
                                                    <span className="shimmer-text">Thinking</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <form ref={(n) => { formRef.current = n; cardRef.current = n }} className={`chat-assistant-card ${isPopoverOpen ? "chat-assistant-card--popover-open" : ""}`} onSubmit={onSubmit}>
                            <div className="chat-assistant-row">
                                <textarea
                                    id="chat-assistant-textarea"
                                    aria-label="Ask a question..."
                                    autoComplete="off"
                                    placeholder="Ask a question..."
                                    className="chat-assistant-input"
                                    style={{ resize: "none", height: "60px" }}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={onTextareaKeyDown}
                                    onFocus={onTextareaFocus}
                                    ref={textareaRef}
                                />
                                <span className="chat-assistant-hint">Ctrl+I</span>
                                <button type="submit" className="chat-assistant-send-button" aria-label="Send message" disabled={!canSend}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-assistant-send-icon">
                                        <path d="m5 12 7-7 7 7" />
                                        <path d="M12 19V5" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

type DocsFooterProps = {
    onRef: (node: HTMLElement | null) => void
    stars: string | null
}

function DocsFooter({ onRef, stars }: DocsFooterProps) {
    return (
        <footer className="home-footer" ref={onRef}>
            <div className="home-footer-brand">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="home-footer-flower">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 9V3M12 21v-6M9 12H3m18 0h-6M18.36 5.64l-4.24 4.24m-4.24 4.24l-4.24 4.24m12.72 0l-4.24-4.24m-4.24-4.24L5.64 5.64" />
                </svg>
                <span className="home-footer-name">CASCADE</span>
            </div>
            <div className="home-footer-links">
                <Link href="/docs/overview" className="home-footer-btn home-footer-btn-docs">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M11 4.717c-2.286-.58-4.16-.756-7.045-.71A1.99 1.99 0 0 0 2 6v11c0 1.133.934 2.022 2.044 2.007 2.759-.038 4.5.16 6.956.791V4.717Zm2 15.081c2.456-.631 4.198-.829 6.956-.791A2.013 2.013 0 0 0 22 16.999V6a1.99 1.99 0 0 0-1.955-1.993c-2.885-.046-4.76.13-7.045.71v15.081Z" clipRule="evenodd" />
                    </svg>
                    Read the docs
                </Link>
                <a href="https://github.com/kirosnn/cascade" target="_blank" rel="noreferrer" className="home-footer-btn home-footer-btn-github">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.392 6.478 10.927 10.927 0 0 0 1.393 6.938 11.002 11.002 0 0 0 4.836 4.473c.504.096.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621a2.147 2.147 0 0 1 1.552 1.07 2.211 2.211 0 0 0 1.505.89 2.22 2.22 0 0 0 1.522-.465 2.199 2.199 0 0 1 .654-1.428c-2.22-.258-4.555-1.144-4.555-5.09a4.01 4.01 0 0 1 1.055-2.784 3.824 3.824 0 0 1 .1-2.744s.859-.282 2.81 1.07a9.638 9.638 0 0 1 5.122 0c1.95-1.352 2.805-1.07 2.805-1.07a3.83 3.83 0 0 1 .1 2.744 4.004 4.004 0 0 1 1.053 2.784c0 3.957-2.339 4.83-4.566 5.084a2.482 2.482 0 0 1 .71 1.948c0 1.405-.013 2.538-.013 2.882 0 .274.177.595.688.494a11.006 11.006 0 0 0 4.829-4.469 10.916 10.916 0 0 0 1.383-6.933A10.312 10.312 0 0 0 18.483 4.44 9.851 9.851 0 0 0 12.007 2Z" clipRule="evenodd" />
                    </svg>
                    See on GitHub
                    {stars ? (
                        <>
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
                            </svg>
                            {stars}
                        </>
                    ) : null}
                </a>
            </div>
        </footer>
    )
}

type DocsSiteClientProps = {
    pages: DocPage[]
    groupedPages: Record<string, DocPage[]>
    currentPage: DocPage
    stars: string | null
}

export default function DocsSiteClient({ pages, groupedPages, currentPage, stars }: DocsSiteClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [search, dispatchSearch] = useReducer(searchReducer, { query: "", highlightedIndex: 0, isOpen: false })
    const [layout, dispatchLayout] = useReducer(layoutReducer, {
        mounted: false,
        footerEl: null,
        isFooterVisible: false,
        mainContentEl: null,
        docsBarStyle: {},
    })
    const searchInputRef = useRef<HTMLInputElement>(null)
    const sidebarRef = useRef<HTMLElement | null>(null)
    const footerElRef = useRef<HTMLElement | null>(null)
    const mainContentElRef = useRef<HTMLElement | null>(null)
    const highlightTimeoutRef = useRef<number | null>(null)
    const isSearchOpenRef = useRef(search.isOpen)
    isSearchOpenRef.current = search.isOpen

    const setFooterEl = useCallback((node: HTMLElement | null) => {
        if (footerElRef.current === node) return
        footerElRef.current = node
        dispatchLayout({ type: "SET_FOOTER_EL", el: node })
    }, [])

    const setMainContentEl = useCallback((node: HTMLElement | null) => {
        if (mainContentElRef.current === node) return
        mainContentElRef.current = node
        dispatchLayout({ type: "SET_MAIN_CONTENT_EL", el: node })
    }, [])

    const engine = useMemo(() => createSearchEngine(pages), [pages])
    const results = useMemo(() => engine.search(search.query, 12), [engine, search.query])

    useEffect(() => {
        dispatchLayout({ type: "MOUNTED" })
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                if (isSearchOpenRef.current) {
                    dispatchSearch({ type: "CLOSE" })
                } else {
                    dispatchSearch({ type: "OPEN" })
                    setTimeout(() => searchInputRef.current?.focus(), 50)
                }
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    useEffect(() => {
        const sidebar = sidebarRef.current
        if (!sidebar) return
        const stored = sessionStorage.getItem(SIDEBAR_SCROLL_KEY)
        if (!stored) return
        const value = Number(stored)
        if (!Number.isFinite(value)) return
        sidebar.scrollTop = value
    }, [pathname])

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current !== null) {
                window.clearTimeout(highlightTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const highlightFromHash = () => {
            const hash = window.location.hash
            if (!hash.startsWith("#")) return
            const id = hash.slice(1)
            if (!id) return
            const el = document.getElementById(id)
            if (!el) return
            const title = el.querySelector("h2")
            if (!title) return
            title.classList.add(SECTION_TITLE_HIGHLIGHT_CLASS)
            highlightTimeoutRef.current = window.setTimeout(() => {
                title.classList.remove(SECTION_TITLE_HIGHLIGHT_CLASS)
            }, 1200)
        }

        highlightFromHash()
        window.addEventListener("hashchange", highlightFromHash)
        return () => window.removeEventListener("hashchange", highlightFromHash)
    }, [pathname, currentPage.id, currentPage.sections.length])

    useEffect(() => {
        const { footerEl } = layout
        if (!footerEl) return
        const observer = new IntersectionObserver(
            ([entry]) => { dispatchLayout({ type: "SET_FOOTER_VISIBLE", visible: Boolean(entry?.isIntersecting) }) },
            { root: null, threshold: 0 }
        )
        observer.observe(footerEl)
        return () => observer.disconnect()
    }, [layout.footerEl])

    useEffect(() => {
        const { mainContentEl } = layout
        if (!mainContentEl) return
        const update = () => {
            const rect = mainContentEl.getBoundingClientRect()
            if (!rect.width) return
            dispatchLayout({ type: "SET_DOCS_BAR_STYLE", style: { left: `${Math.round(rect.left)}px`, width: `${Math.round(rect.width)}px` } })
        }
        update()
        window.addEventListener("resize", update)
        const ro = new ResizeObserver(update)
        ro.observe(mainContentEl)
        return () => {
            window.removeEventListener("resize", update)
            ro.disconnect()
        }
    }, [layout.mainContentEl, pathname])

    const selectResult = (entry: SearchEntry) => {
        dispatchSearch({ type: "CLOSE" })
        window.scrollTo({ top: 0 })
        if (entry.pageId === currentPage.id) {
            router.push(`#${entry.sectionId}`, { scroll: false })
            return
        }
        router.push(`/docs/${entry.pageId}#${entry.sectionId}`, { scroll: false })
    }

    const persistSidebarScroll = () => {
        const sidebar = sidebarRef.current
        if (!sidebar) return
        sessionStorage.setItem(SIDEBAR_SCROLL_KEY, sidebar.scrollTop.toString())
    }

    const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (results.length === 0) {
            if (event.key === "Escape") dispatchSearch({ type: "CLOSE" })
            return
        }
        if (event.key === "ArrowDown") { event.preventDefault(); dispatchSearch({ type: "MOVE_DOWN", total: results.length }); return }
        if (event.key === "ArrowUp") { event.preventDefault(); dispatchSearch({ type: "MOVE_UP", total: results.length }); return }
        if (event.key === "Enter") { event.preventDefault(); const entry = results[search.highlightedIndex]; if (entry) selectResult(entry); return }
        if (event.key === "Escape") { event.preventDefault(); dispatchSearch({ type: "CLOSE" }) }
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) dispatchSearch({ type: "CLOSE" })
    }

    const handleSidebarLinkClick = () => {
        persistSidebarScroll()
        window.scrollTo({ top: 0 })
    }

    return (
        <div className="site-shell">
            <header className="navbar">
                <Link href="/" className="brand">
                    <span className="brand-mark">
                        <Image src="/icon.svg" alt="Cascade logo" width={34} height={34} />
                    </span>
                    <span>Cascade</span>
                </Link>

                <div className="search-wrap">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <button className="search-btn" onClick={() => { dispatchSearch({ type: "OPEN" }); setTimeout(() => searchInputRef.current?.focus(), 50) }}>
                        <span>Search docs...</span>
                    </button>
                    {search.isOpen && layout.mounted && (
                        <SearchModal
                            query={search.query}
                            highlightedIndex={search.highlightedIndex}
                            results={results}
                            searchInputRef={searchInputRef}
                            onOverlayClick={handleOverlayClick}
                            onQueryChange={(q) => dispatchSearch({ type: "SET_QUERY", query: q })}
                            onKeyDown={onSearchKeyDown}
                            onResultSelect={selectResult}
                            onResultHover={(index) => dispatchSearch({ type: "SET_HIGHLIGHTED", index })}
                        />
                    )}
                </div>

                <nav className="nav-links">
                    <Link href="/docs/overview" className="nav-link">Docs</Link>
                    <a href="https://github.com/kirosnn/cascade" target="_blank" rel="noreferrer" className="nav-link">GitHub</a>
                </nav>
            </header>

            <div className="content-grid">
                <DocsSidebar
                    groupedPages={groupedPages}
                    pathname={pathname}
                    sidebarRef={sidebarRef}
                    onScroll={persistSidebarScroll}
                    onLinkClick={handleSidebarLinkClick}
                />
                <main className="main-content" ref={setMainContentEl}>
                    <article className="article-card">
                        <h1>{currentPage.title}</h1>
                        {currentPage.subtitle ? <p className="lead">{currentPage.subtitle}</p> : null}
                        {currentPage.sections.map((section) => (
                            <section className="doc-section" id={section.id} key={section.id}>
                                <h2>{section.title}</h2>
                                {section.content}
                            </section>
                        ))}
                    </article>
                </main>
            </div>

            <DocsBottomBar isFooterVisible={layout.isFooterVisible} docsBarStyle={layout.docsBarStyle} />
            <DocsFooter onRef={setFooterEl} stars={stars} />
        </div>
    )
}
