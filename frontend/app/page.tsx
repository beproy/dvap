import Link from "next/link"
import SystemsList from "@/components/systems/SystemsList"

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1
          className="text-text-primary font-medium"
          style={{ fontSize: "var(--text-xl)" }}
        >
          DVAP
        </h1>
        <p
          className="text-text-secondary mt-1"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Map your system. Model the threats. Understand the risk.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-4 mb-12">
        {/* Quick form -- outline style */}
        <Link
          href="/systems/new"
          className="flex flex-col gap-1.5 px-5 py-4 rounded-lg border border-border-subtle bg-surface-raised hover:border-border-default transition-colors"
          style={{ minWidth: 200 }}
        >
          <span
            className="text-text-primary font-medium"
            style={{ fontSize: "var(--text-md)" }}
          >
            Quick form
          </span>
          <span
            className="text-text-secondary"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Describe components and flows in a structured form.
          </span>
        </Link>

        {/* Visual editor -- filled cyan (one of three cyan uses on this page) */}
        <Link
          href="/systems/new/visual"
          className="flex flex-col gap-1.5 px-5 py-4 rounded-lg bg-accent hover:bg-accent-bright transition-colors"
          style={{ minWidth: 200 }}
        >
          <span
            className="text-surface-base font-medium"
            style={{ fontSize: "var(--text-md)" }}
          >
            Visual editor
          </span>
          <span
            className="text-surface-elevated"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Drag, connect, and edit a diagram.
          </span>
        </Link>
      </div>

      {/* Systems list */}
      <div className="mb-4">
        <p
          className="text-text-tertiary font-medium uppercase"
          style={{
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          Recent Systems
        </p>
      </div>

      <SystemsList />
    </div>
  )
}
