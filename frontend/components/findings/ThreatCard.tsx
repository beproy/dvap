"use client"

import type { Threat } from "@/lib/types"

const IMPACT_COLORS: Record<string, string> = {
  High:   "var(--severity-critical)",
  Medium: "var(--severity-high)",
  Low:    "var(--severity-low)",
}

const AGENT_LABEL: Record<string, string> = {
  stride:  "STRIDE",
  maestro: "MAESTRO",
}

interface Props {
  threat: Threat
}

export default function ThreatCard({ threat }: Props) {
  const impact = threat.impact ?? "Medium"
  const severityColor = IMPACT_COLORS[impact] ?? IMPACT_COLORS["Medium"]

  return (
    <div
      className="rounded-lg bg-surface-raised"
      style={{
        borderTop:    "0.5px solid var(--border-subtle)",
        borderRight:  "0.5px solid var(--border-subtle)",
        borderBottom: "0.5px solid var(--border-subtle)",
        borderLeft:   `2px solid ${severityColor}`,
      }}
    >
      <div className="px-4 py-3 space-y-2.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <h4
            className="text-text-primary font-medium leading-snug"
            style={{ fontSize: "var(--text-md)" }}
          >
            {threat.title}
          </h4>
          <span
            className="uppercase font-medium shrink-0"
            style={{
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-wide)",
              color: severityColor,
            }}
          >
            {impact}
          </span>
        </div>

        {/* Description */}
        <p
          className="text-text-secondary"
          style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}
        >
          {threat.description}
        </p>

        {/* Attack vector (STRIDE) */}
        {threat.attack_vector && (
          <div>
            <p
              className="text-text-tertiary uppercase font-medium mb-0.5"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              Attack Vector
            </p>
            <p
              className="text-text-secondary"
              style={{ fontSize: "var(--text-sm)" }}
            >
              {threat.attack_vector}
            </p>
          </div>
        )}

        {/* Abuse case (MAESTRO) */}
        {threat.abuse_case && (
          <div>
            <p
              className="text-text-tertiary uppercase font-medium mb-0.5"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              Abuse Case
            </p>
            <p
              className="text-text-secondary"
              style={{ fontSize: "var(--text-sm)" }}
            >
              {threat.abuse_case}
            </p>
          </div>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span
            className="px-2 py-0.5 rounded text-text-tertiary"
            style={{
              border: "0.5px solid var(--border-subtle)",
              fontSize: "var(--text-xs)",
            }}
          >
            {threat.category}
          </span>
          <span
            className="px-2 py-0.5 rounded text-text-tertiary"
            style={{
              border: "0.5px solid var(--border-subtle)",
              fontSize: "var(--text-xs)",
            }}
          >
            {threat.component_name}
          </span>
          <span
            className="px-2 py-0.5 rounded text-text-tertiary"
            style={{
              border: "0.5px solid var(--border-subtle)",
              fontSize: "var(--text-xs)",
            }}
          >
            L: {threat.likelihood}
          </span>
          {threat.source_agent && (
            <span
              className="px-2 py-0.5 rounded text-text-tertiary"
              style={{
                border: "0.5px solid var(--border-subtle)",
                fontSize: "var(--text-xs)",
              }}
            >
              {AGENT_LABEL[threat.source_agent] ?? threat.source_agent}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
