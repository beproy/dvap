import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-slate-100 font-semibold text-sm hover:text-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Dynamic Vulnerability &amp; Attack Path Platform (DVAP)
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/systems/new"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            New System
          </Link>
          <Link
            href="/about"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
