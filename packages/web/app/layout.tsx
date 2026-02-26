import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Cascade",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cascade-docs.vercel.app"),
  description:
    "Build fast, production-ready terminal apps with Cascade: core renderer APIs, React and Solid integrations, crash diagnostics, selection workflows, and deployment guides.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Cascade Documentation",
    description:
      "Build fast, production-ready terminal apps with Cascade: core renderer APIs, React and Solid integrations, crash diagnostics, selection workflows, and deployment guides.",
    type: "website",
    images: [
      {
        url: "/bg.png",
        width: 1200,
        height: 630,
        alt: "Cascade Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cascade Documentation",
    description:
      "Build fast, production-ready terminal apps with Cascade: core renderer APIs, React and Solid integrations, crash diagnostics, selection workflows, and deployment guides.",
    images: ["/bg.png"],
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
