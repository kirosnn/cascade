import DocsSiteClient from "@/components/docs-site.client"
import type { DocPage } from "@/lib/docs"

type DocsSiteProps = {
  pages: DocPage[]
  groupedPages: Record<string, DocPage[]>
  currentPage: DocPage
}

async function getGithubStars(): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/repos/kirosnn/cascade", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github+json" },
    })
    if (!response.ok) return null
    const data = (await response.json()) as { stargazers_count?: number }
    if (typeof data.stargazers_count !== "number") return null
    return new Intl.NumberFormat("en-US").format(data.stargazers_count)
  } catch {
    return null
  }
}

export default async function DocsSite({ pages, groupedPages, currentPage }: DocsSiteProps) {
  const stars = await getGithubStars()
  return <DocsSiteClient pages={pages} groupedPages={groupedPages} currentPage={currentPage} stars={stars} />
}