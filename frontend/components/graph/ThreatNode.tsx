"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type ThreatNodeData = {
  label: string
  category?: string
  impact?: string
  likelihood?: string
}

const IMPACT_COLORS: Record<string, string> = {
  High:   "var(--severity-critical)",
  Medium: "var(--severity-high)",
  Low:    "var(--severity-low)",
}

function ThreatNode({ data }: NodeProps<ThreatNodeData>) {
  const impact = data.impact ?? "Medium"
  const severityColor = IMPACT_COLORS[impact] ?? IMPACT_COLORS["Medium"]

  const label =
    data.label.length > 55 ? data.label.slice(0, 52) + "..." : data.label

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!border-border-default !bg-surface-elevated !w-2 !h-2"
      />
      <div
        className="rounded-lg bg-surface-raised px-3 py-2.5 min-w-[140px] max-w-[180px]"
        style={{
          borderTop:    "0.5px solid var(--border-subtle)",
          borderRight:  "0.5px solid var(--border-subtle)",
          borderBottom: "0.5px solid var(--border-subtle)",
          borderLeft:   `2px solid ${severityColor}`,
        }}
      >
        <p
          className="text-text-primary font-medium leading-tight mb-1.5"
          style={{ fontSize: "var(--text-sm)" }}
        >
          {label}
        </p>
        <span
          className="uppercase font-medium"
          style={{
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-wide)",
            color: severityColor,
          }}
        >
          {impact}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!border-border-default !bg-surface-elevated !w-2 !h-2"
      />
    </>
  )
}

export default memo(ThreatNode)
