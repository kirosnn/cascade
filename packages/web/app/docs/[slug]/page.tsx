import { notFound } from "next/navigation"
import { DocsSite } from "@/components/docs-site"
import { docPages, getGroupedPages, getPageById } from "@/lib/docs"

export function generateStaticParams() {
  return docPages.map((page) => ({ slug: page.id }))
}

export default async function DocsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const currentPage = getPageById(slug)
  if (!currentPage) {
    notFound()
  }

  return <DocsSite pages={docPages} groupedPages={getGroupedPages()} currentPage={currentPage} />
}
