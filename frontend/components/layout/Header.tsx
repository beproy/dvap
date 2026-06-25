import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-surface-base border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            className="rounded-full bg-accent shrink-0"
            style={{ width: 6, height: 6 }}
            aria-hidden="true"
          />
          <span className="text-text-primary font-medium text-sm">DVAP</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/systems/new"
            className="text-text-secondary hover:text-text-primary transition-colors text-sm rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            New System
          </Link>
          <Link
            href="/about"
            className="text-text-secondary hover:text-text-primary transition-colors text-sm rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
