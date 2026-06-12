"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#020617",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            Application error
          </p>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: "6px" }}>
            Something went wrong loading the application. Try reloading the page.
          </p>
        </div>
        {error.message && (
          <pre
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.75rem",
              color: "#64748b",
              maxWidth: "480px",
              textAlign: "left",
              overflowX: "auto",
            }}
          >
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "8px",
            padding: "8px 20px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
