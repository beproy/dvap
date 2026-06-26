import Link from "next/link"
import SystemsList from "@/components/systems/SystemsList"
import LandingPreview from "@/components/landing/LandingPreview"

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-8" style={{ maxWidth: 640 }}>
        <h1
          className="text-text-primary font-medium"
          style={{ fontSize: "var(--text-2xl)" }}
        >
          DVAP
        </h1>
        <p
          className="text-text-secondary font-medium"
          style={{ fontSize: "var(--text-md)" }}
        >
          AI security copilot for architects.
        </p>
        <p
          className="text-text-secondary"
          style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, marginTop: 24 }}
        >
          Multi-agent threat modeling that maps your system to MITRE ATT&amp;CK,
          identifies attack paths, and recommends CIS controls.
        </p>
        <p
          className="text-text-secondary"
          style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, marginTop: 12 }}
        >
          Five AI agents complete a full analysis in under three minutes,
          grounded against a local knowledge graph of 697 verified ATT&amp;CK
          techniques so they cannot hallucinate IDs.
        </p>
      </div>

      {/* Static preview */}
      <div
        className="mb-3 rounded-lg"
        style={{
          maxWidth: 800,
          height: 260,
          background: "var(--surface-raised)",
          border: "0.5px solid var(--border-subtle)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 6 }}>
          <LandingPreview />
        </div>
      </div>
      <div className="mb-8" style={{ maxWidth: 800 }}>
        <p
          className="text-text-tertiary text-center"
          style={{ fontSize: "var(--text-xs)", marginTop: 12 }}
        >
          Example: how DVAP identifies a SQL injection threat targeting a
          customer database via the API gateway.
        </p>
      </div>

      {/* Primary CTA: Visual editor */}
      <div className="mb-4" style={{ maxWidth: 640 }}>
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--accent)",
            backgroundImage:
              "linear-gradient(rgba(77, 208, 225, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77, 208, 225, 0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <h2
            className="text-text-primary font-medium"
            style={{ fontSize: "var(--text-md)" }}
          >
            Visual editor
          </h2>
          <p
            className="text-text-secondary mt-1.5 mb-5"
            style={{ fontSize: "var(--text-sm)", lineHeight: 1.55 }}
          >
            Drag components, draw data flows, let five AI agents find the threats.
          </p>
          <Link
            href="/systems/new/visual"
            className="inline-flex items-center px-4 py-1.5 rounded font-medium transition-opacity hover:opacity-90"
            style={{
              fontSize: "var(--text-sm)",
              background: "var(--accent)",
              color: "var(--surface-base)",
            }}
          >
            Build your threat model &rarr;
          </Link>
        </div>
      </div>

      {/* Secondary text link */}
      <div className="mb-14">
        <p
          className="text-text-tertiary"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Or use the{" "}
          <Link
            href="/systems/new"
            className="underline hover:text-text-secondary transition-colors"
            style={{ color: "inherit" }}
          >
            quick form
          </Link>{" "}
          for known systems
        </p>
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
