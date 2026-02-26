import Link from "next/link"

export default function HomePage() {
  return (
    <div className="site-shell">
      <header className="navbar navbar-home">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <img src="/icon.svg" alt="Cascade logo" width={34} height={34} />
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
        <h1><span className="hero-accent">Cascade</span> is the <span className="hero-u">right</span> choice.</h1>
        <p>Cascade is a native terminal UI foundation written in Zig with TypeScript bindings. The core exposes a C ABI, so it can be integrated from any language. It is designed for correctness, stability, extensibility, and performance, with a component-driven model and flexible layout primitives for building advanced terminal apps.</p>
      </div>
    </div>
  )
}
