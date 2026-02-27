import Link from "next/link"
import Image from "next/image"
import { CodeBlock } from "@/components/code-block"
import { HomeQuickstart } from "@/components/home-quickstart"

async function getGithubStars(): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/repos/kirosnn/cascade", {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/vnd.github+json",
      },
    })
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as { stargazers_count?: number }
    if (typeof data.stargazers_count !== "number") {
      return null
    }
    return new Intl.NumberFormat("en-US").format(data.stargazers_count)
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stars = await getGithubStars()

  return (
    <div className="site-shell">
      <header className="navbar navbar-home">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Image src="/icon.svg" alt="Cascade logo" width={34} height={34} />
          </span>
          <span>Cascade</span>
        </Link>
        <nav className="nav-links">
          <Link href="/docs/overview" className="nav-link">
            Docs
          </Link>
          <a href="https://github.com/kirosnn/cascade" target="_blank" rel="noreferrer" className="nav-link">
            GitHub
          </a>
        </nav>
      </header>
      <div className="home-hero">
        <h1>When you want a good TUI experience,</h1>
        <h1>
          <span className="hero-accent">Cascade</span> is the <span className="hero-u">right</span> choice.
        </h1>
        <p>Cascade is a native terminal UI foundation written in Zig with TypeScript bindings. The core exposes a C ABI, so it can be integrated from any language. It is designed for correctness, stability, extensibility, and performance, with a component-driven model and flexible layout primitives for building advanced terminal apps.</p>
        <div className="home-hero-example">
          <CodeBlock
            language="tsx"
            code={`import { createCliRenderer } from "@cascadetui/core"
import { createRoot } from "@cascadetui/react"

function App() {
  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <asciifont text="Cascade" font="tiny" color="#20808d" />
      <text
        content="Cascade is a native terminal UI runtime and component model, written in Zig with TypeScript APIs."
        fg="#888888"
      />
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)`}
          />
        </div>
        <p style={{ fontSize: "0.9rem" }}>
          *basic template, to see more go to{" "}
          <a href="https://cascadetui.org/docs/overview" className="doc-link">
            docs
          </a>
        </p>
      </div>
      <HomeQuickstart />
      <footer className="home-footer">
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
          <a
            href="https://github.com/kirosnn/cascade"
            target="_blank"
            rel="noreferrer"
            className="home-footer-btn home-footer-btn-github"
          >
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
    </div>
  )
}
