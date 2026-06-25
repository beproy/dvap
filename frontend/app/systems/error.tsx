"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function SystemsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="rounded-lg bg-surface-raised p-6 max-w-md w-full space-y-4"
        style={{
          borderTop:    "0.5px solid var(--border-subtle)",
          borderRight:  "0.5px solid var(--border-subtle)",
          borderBottom: "0.5px solid var(--border-subtle)",
          borderLeft:   "2px solid var(--severity-critical)",
        }}
      >
        <AlertTriangle
          className="h-5 w-5"
          style={{ color: "var(--severity-critical)" }}
        />
        <div>
          <p
            className="text-text-primary font-medium"
            style={{ fontSize: "var(--text-base)" }}
          >
            Something went wrong
          </p>
          <p
            className="text-text-secondary mt-1"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Could not load the systems list. Check that the backend service
            is running.
          </p>
        </div>
        {error.message && (
          <pre
            className="text-text-tertiary overflow-auto rounded"
            style={{
              fontSize:   "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              background: "var(--surface-base)",
              padding:    "var(--space-3)",
              lineHeight: 1.5,
            }}
          >
            {error.message}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-lg border border-border-default text-text-primary hover:bg-surface-elevated transition-colors"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary transition-colors"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Back to systems
          </Link>
        </div>
      </div>
    </div>
  )
}
