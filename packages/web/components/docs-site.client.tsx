"use client"

import Link from "next/link"
import { useMemo, useState, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter } from "next/navigation"
import type { DocPage } from "@/lib/docs"
import { createSearchEngine, type SearchEntry } from "@/lib/search"

const SIDEBAR_SCROLL_KEY = "cascade-docs:sidebar-scroll"
const SECTION_TITLE_HIGHLIGHT_CLASS = "doc-section-title--highlight"

type DocsSiteClientProps = {
    pages: DocPage[]
    groupedPages: Record<string, DocPage[]>
    currentPage: DocPage
    stars: string | null
}

export default function DocsSiteClient({ pages, groupedPages, currentPage, stars }: DocsSiteClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [query, setQuery] = useState("")
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const sidebarRef = useRef<HTMLElement | null>(null)
    const highlightTimeoutRef = useRef<number | null>(null)

    const engine = useMemo(() => createSearchEngine(pages), [pages])
    const results = useMemo(() => engine.search(query, 12), [engine, query])

    useEffect(() => {
        setMounted(true)
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsSearchOpen((open) => !open)
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

        const onHashChange = () => {
            highlightFromHash()
        }

        highlightFromHash()
        window.addEventListener("hashchange", onHashChange)
        return () => window.removeEventListener("hashchange", onHashChange)
    }, [pathname, currentPage.id, currentPage.sections.length])

    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50)
        } else {
            setQuery("")
            setHighlightedIndex(0)
        }
    }, [isSearchOpen])

    const selectResult = (entry: SearchEntry) => {
        setQuery("")
        setHighlightedIndex(0)
        setIsSearchOpen(false)

        if (entry.pageId === currentPage.id) {
            window.scrollTo({ top: 0 })
            router.push(`#${entry.sectionId}`, { scroll: false })
            return
        }

        window.scrollTo({ top: 0 })
        router.push(`/docs/${entry.pageId}#${entry.sectionId}`, { scroll: false })
    }

    const persistSidebarScroll = () => {
        const sidebar = sidebarRef.current
        if (!sidebar) return
        sessionStorage.setItem(SIDEBAR_SCROLL_KEY, sidebar.scrollTop.toString())
    }

    const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (results.length === 0) {
            if (event.key === "Escape") setIsSearchOpen(false)
            return
        }

        if (event.key === "ArrowDown") {
            event.preventDefault()
            setHighlightedIndex((index) => (index + 1) % results.length)
            return
        }

        if (event.key === "ArrowUp") {
            event.preventDefault()
            setHighlightedIndex((index) => (index - 1 + results.length) % results.length)
            return
        }

        if (event.key === "Enter") {
            event.preventDefault()
            const entry = results[highlightedIndex]
            if (entry) selectResult(entry)
            return
        }

        if (event.key === "Escape") {
            event.preventDefault()
            setIsSearchOpen(false)
        }
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsSearchOpen(false)
        }
    }

    return (
        <div className="site-shell">
            <header className="navbar">
                <Link href="/" className="brand">
                    <span className="brand-mark">
                        <img src="/icon.svg" alt="Cascade logo" width={34} height={34} />
                    </span>
                    <span>Cascade</span>
                </Link>

                <div className="search-wrap">
                    <svg
                        className="search-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <button className="search-btn" onClick={() => setIsSearchOpen(true)}>
                        <span>Search docs...</span>
                    </button>

                    {isSearchOpen && mounted && createPortal(
                        <div className="search-modal-overlay" onClick={handleOverlayClick}>
                            <div className="search-modal-content">
                                <div className="search-modal-header">
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input
                                        ref={searchInputRef}
                                        className="search-modal-input"
                                        value={query}
                                        onChange={(event) => {
                                            setQuery(event.target.value)
                                            setHighlightedIndex(0)
                                        }}
                                        onKeyDown={onSearchKeyDown}
                                        placeholder="Search documentation..."
                                    />
                                </div>
                                {query.trim().length > 0 && (
                                    <div className="search-modal-body">
                                        {results.length === 0 ? (
                                            <div className="search-modal-empty">
                                                No results found for "{query}".
                                            </div>
                                        ) : (
                                            results.map((entry, index) => (
                                                <button
                                                    type="button"
                                                    key={`${entry.pageId}:${entry.sectionId}`}
                                                    className={`search-item ${index === highlightedIndex ? "active" : ""}`}
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                    onClick={() => selectResult(entry)}
                                                >
                                                    <div className="search-title">
                                                        {entry.pageTitle} - {entry.sectionTitle}
                                                    </div>
                                                    <div className="search-meta">{entry.preview}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>,
                        document.body
                    )}
                </div>

                <nav className="nav-links">
                    <Link href="/docs/overview" className="nav-link">
                        Docs
                    </Link>
                    <a href="https://github.com/kirosnn/cascade" target="_blank" rel="noreferrer" className="nav-link">
                        GitHub
                    </a>
                </nav>
            </header>

            <div className="content-grid">
                <aside
                    className="sidebar"
                    ref={(node) => {
                        sidebarRef.current = node
                    }}
                    onScroll={persistSidebarScroll}
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
                                        onClick={() => {
                                            persistSidebarScroll()
                                            window.scrollTo({ top: 0 })
                                        }}
                                    >
                                        {page.title}
                                    </Link>
                                )
                            })}
                        </section>
                    ))}
                </aside>

                <main className="main-content">
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

            <footer className="home-footer">
                <div className="home-footer-brand">
                    <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="home-footer-flower"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 9V3M12 21v-6M9 12H3m18 0h-6M18.36 5.64l-4.24 4.24m-4.24 4.24l-4.24 4.24m12.72 0l-4.24-4.24m-4.24-4.24L5.64 5.64" />
                    </svg>
                    <span className="home-footer-name">CASCADE</span>
                </div>

                <div className="home-footer-links">
                    <Link href="/docs/overview" className="home-footer-btn home-footer-btn-docs">
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                fillRule="evenodd"
                                d="M11 4.717c-2.286-.58-4.16-.756-7.045-.71A1.99 1.99 0 0 0 2 6v11c0 1.133.934 2.022 2.044 2.007 2.759-.038 4.5.16 6.956.791V4.717Zm2 15.081c2.456-.631 4.198-.829 6.956-.791A2.013 2.013 0 0 0 22 16.999V6a1.99 1.99 0 0 0-1.955-1.993c-2.885-.046-4.76.13-7.045.71v15.081Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Read the docs
                    </Link>

                    <a href="https://github.com/kirosnn/cascade" target="_blank" rel="noreferrer" className="home-footer-btn home-footer-btn-github">
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                fillRule="evenodd"
                                d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.392 6.478 10.927 10.927 0 0 0 1.393 6.938 11.002 11.002 0 0 0 4.836 4.473c.504.096.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621a2.147 2.147 0 0 1 1.552 1.07 2.211 2.211 0 0 0 1.505.89 2.22 2.22 0 0 0 1.522-.465 2.199 2.199 0 0 1 .654-1.428c-2.22-.258-4.555-1.144-4.555-5.09a4.01 4.01 0 0 1 1.055-2.784 3.824 3.824 0 0 1 .1-2.744s.859-.282 2.81 1.07a9.638 9.638 0 0 1 5.122 0c1.95-1.352 2.805-1.07 2.805-1.07a3.83 3.83 0 0 1 .1 2.744 4.004 4.004 0 0 1 1.053 2.784c0 3.957-2.339 4.83-4.566 5.084a2.482 2.482 0 0 1 .71 1.948c0 1.405-.013 2.538-.013 2.882 0 .274.177.595.688.494a11.006 11.006 0 0 0 4.829-4.469 10.916 10.916 0 0 0 1.383-6.933A10.312 10.312 0 0 0 18.483 4.44 9.851 9.851 0 0 0 12.007 2Z"
                                clipRule="evenodd"
                            />
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
        </div>
    )
}
