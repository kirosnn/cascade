"use client"

import Link from "next/link"
import { useMemo, useState, type KeyboardEvent } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { DocPage } from "@/lib/docs"
import { createSearchEngine, type SearchEntry } from "@/lib/search"

type DocsSiteProps = {
  pages: DocPage[]
  groupedPages: Record<string, DocPage[]>
  currentPage: DocPage
}

export function DocsSite({ pages, groupedPages, currentPage }: DocsSiteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const engine = useMemo(() => createSearchEngine(pages), [pages])
  const results = useMemo(() => engine.search(query, 12), [engine, query])

  const selectResult = (entry: SearchEntry) => {
    setQuery("")
    setHighlightedIndex(0)
    router.push(`/docs/${entry.pageId}#${entry.sectionId}`)
  }

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return

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
      setQuery("")
      setHighlightedIndex(0)
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
          <input
            className="search-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlightedIndex(0)
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Search docs, APIs, sections"
          />
          {query.trim().length > 0 ? (
            <div className="search-results">
              {results.length === 0 ? (
                <div className="search-item">
                  <div className="search-title">No result</div>
                  <div className="search-meta">Use qualifiers: page:react section:selection in:title</div>
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
          ) : null}
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
        <aside className="sidebar">
          {Object.entries(groupedPages).map(([group, groupItems]) => (
            <section className="side-group" key={group}>
              <h3 className="side-title">{group}</h3>
              {groupItems.map((page) => {
                const isActive = pathname === `/docs/${page.id}`
                return (
                  <Link className={`side-link ${isActive ? "active" : ""}`} href={`/docs/${page.id}`} key={page.id}>
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
    </div>
  )
}
