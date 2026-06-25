"use client"

import { useEffect, useRef } from "react"
import type { RunStatus } from "@/lib/types"

const STATUS_STYLES: Record<
  RunStatus,
  { label: string; color: string; bg: string; border: string; pulse?: boolean }
> = {
  pending: {
    label:  "Pending",
    color:  "var(--status-pending)",
    bg:     "transparent",
    border: "var(--border-default)",
  },
  running: {
    label:  "Running",
    color:  "var(--status-running)",
    bg:     "rgba(77, 208, 225, 0.08)",
    border: "rgba(77, 208, 225, 0.25)",
    pulse:  true,
  },
  completed: {
    label:  "Completed",
    color:  "var(--status-completed)",
    bg:     "rgba(109, 203, 131, 0.08)",
    border: "rgba(109, 203, 131, 0.25)",
  },
  failed: {
    label:  "Failed",
    color:  "var(--status-failed)",
    bg:     "rgba(232, 137, 107, 0.08)",
    border: "rgba(232, 137, 107, 0.25)",
  },
}

interface Props {
  status: RunStatus
  className?: string
}

export default function RunStatusBadge({ status, className = "" }: Props) {
  const cfg = STATUS_STYLES[status]
  const spanRef = useRef<HTMLSpanElement>(null)
  const prevStatusRef = useRef<RunStatus>(status)

  useEffect(() => {
    if (prevStatusRef.current !== "completed" && status === "completed") {
      const el = spanRef.current
      if (el) {
        el.classList.remove("status-complete-flash")
        void el.offsetWidth // force reflow so animation restarts
        el.classList.add("status-complete-flash")
      }
    }
    prevStatusRef.current = status
  }, [status])

  return (
    <span
      ref={spanRef}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded uppercase font-medium ${className}`}
      style={{
        fontSize:        "var(--text-xs)",
        letterSpacing:   "var(--tracking-wide)",
        color:           cfg.color,
        background:      cfg.bg,
        border:          `0.5px solid ${cfg.border}`,
      }}
    >
      {cfg.pulse && (
        <span
          className="rounded-full shrink-0 animate-pulse"
          style={{ width: 5, height: 5, background: cfg.color }}
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  )
}
