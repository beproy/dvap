import Link from "next/link"

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--surface-raised)",
        borderTop: "0.5px solid var(--border-subtle)",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 flex items-start justify-between"
        style={{ paddingTop: 32, paddingBottom: 32 }}
      >
        {/* Left: wordmark + license */}
        <div className="flex flex-col gap-1">
          <span
            className="font-medium text-text-primary"
            style={{ fontSize: "var(--text-md)" }}
          >
            DVAP
          </span>
          <span
            className="text-text-secondary"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Open source. MIT licensed.
          </span>
        </div>

        {/* Right: links + version */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/beproy/dvap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              style={{ fontSize: "var(--text-xs)" }}
            >
              GitHub
            </a>
            <a
              href="https://github.com/beproy/dvap/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              style={{ fontSize: "var(--text-xs)" }}
            >
              Documentation
            </a>
            <a
              href="https://github.com/beproy/dvap/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              style={{ fontSize: "var(--text-xs)" }}
            >
              Issues
            </a>
            <a
              href="https://github.com/beproy/dvap/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              style={{ fontSize: "var(--text-xs)" }}
            >
              License
            </a>
          </div>
          <span
            className="text-text-tertiary"
            style={{ fontSize: "var(--text-xs)" }}
          >
            v1.1.0
          </span>
        </div>
      </div>
    </footer>
  )
}
