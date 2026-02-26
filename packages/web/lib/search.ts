import type { DocPage } from "@/lib/docs"

export type SearchEntry = {
  pageId: string
  pageTitle: string
  pageGroup: string
  sectionId: string
  sectionTitle: string
  preview: string
  score: number
}

type IndexEntry = Omit<SearchEntry, "score"> & {
  searchable: string
  titleOnly: string
}

const diacriticsRegex = /\p{Diacritic}/gu

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(diacriticsRegex, "").toLowerCase().trim()
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return true
  let i = 0
  let j = 0
  while (i < needle.length && j < haystack.length) {
    if (needle[i] === haystack[j]) i += 1
    j += 1
  }
  return i === needle.length
}

function buildIndex(pages: DocPage[]): IndexEntry[] {
  return pages.flatMap((page) =>
    page.sections.map((section) => {
      return {
        pageId: page.id,
        pageTitle: page.title,
        pageGroup: page.group,
        sectionId: section.id,
        sectionTitle: section.title,
        preview: section.searchText,
        searchable: normalizeText(`${page.title} ${section.title} ${section.searchText}`),
        titleOnly: normalizeText(`${page.title} ${section.title}`),
      }
    }),
  )
}

function parseQuery(input: string): {
  query: string
  freeTokens: string[]
  page: string
  section: string
  inTitle: boolean
} {
  const rawParts = input
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const tokens = tokenize(input)
  const consumed = new Set<string>()

  let page = ""
  let section = ""
  let inTitle = false

  for (const rawPart of rawParts) {
    const normalized = normalizeText(rawPart)
    if (normalized.startsWith("page:")) {
      const value = normalized.slice("page:".length)
      if (value) {
        page = value
        consumed.add(value)
      }
      continue
    }
    if (normalized.startsWith("section:")) {
      const value = normalized.slice("section:".length)
      if (value) {
        section = value
        consumed.add(value)
      }
      continue
    }
    if (normalized === "in:title" || normalized === "intitle") {
      inTitle = true
    }
  }

  const freeTokens = tokens.filter((token) => {
    if (token === "page" || token === "section" || token === "in" || token === "title" || token === "intitle") {
      return false
    }
    return !consumed.has(token)
  })

  return {
    query: normalizeText(input),
    freeTokens,
    page,
    section,
    inTitle,
  }
}

function scoreEntry(entry: IndexEntry, parsed: ReturnType<typeof parseQuery>): number {
  if (parsed.page && !entry.pageId.includes(parsed.page)) return -1
  if (parsed.section && !normalizeText(entry.sectionTitle).includes(parsed.section)) return -1

  const target = parsed.inTitle ? entry.titleOnly : entry.searchable
  let score = 0

  if (parsed.freeTokens.length === 0 && (parsed.page || parsed.section || parsed.inTitle)) {
    score += 15
  }

  if (parsed.query && target.includes(parsed.query)) score += 100
  if (entry.titleOnly.includes(parsed.query)) score += 35

  for (const token of parsed.freeTokens) {
    if (target.includes(` ${token} `) || target.startsWith(`${token} `) || target.endsWith(` ${token}`)) {
      score += 24
      continue
    }
    if (target.includes(token)) {
      score += 14
      continue
    }
    if (isSubsequence(token, target)) {
      score += 6
      continue
    }
    score -= 10
  }

  return score
}

export function createSearchEngine(pages: DocPage[]) {
  const index = buildIndex(pages)

  return {
    search(input: string, limit: number = 12): SearchEntry[] {
      const parsed = parseQuery(input)
      if (!parsed.query) return []

      return index
        .map((entry) => ({ ...entry, score: scoreEntry(entry, parsed) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    },
  }
}
