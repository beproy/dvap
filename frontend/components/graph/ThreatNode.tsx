"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type ThreatNodeData = {
  label: string
  category?: string
  impact?: string
  likelihood?: string
}

const IMPACT_STYLES: Record<string, { border: string; badge: string }> = {
  High: { border: "border-red-500", badge: "bg-red-900/50 text-red-300" },
  Medium: { border: "border-orange-500", badge: "bg-orange-900/50 text-orange-300" },
  Low: { border: "border-yellow-500", badge: "bg-yellow-900/50 text-yellow-300" },
}

function ThreatNode({ data }: NodeProps<ThreatNodeData>) {
  const impact = data.impact ?? "Medium"
  const styles = IMPACT_STYLES[impact] ?? IMPACT_STYLES["Medium"]

  const label =
    data.label.length > 55 ? data.label.slice(0, 52) + "..." : data.label

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!border-slate-600 !bg-slate-700 !w-2 !h-2"
      />
      <div
        className={`rounded-lg border-2 ${styles.border} bg-slate-900 px-3 py-2 min-w-[140px] max-w-[180px] shadow-lg`}
      >
        <p className="text-slate-100 text-xs font-medium leading-tight mb-1.5">
          {label}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {data.category && (
            <span className="text-xs text-slate-500">{data.category}</span>
          )}
          {impact && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${styles.badge}`}>
              {impact}
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!border-slate-600 !bg-slate-700 !w-2 !h-2"
      />
    </>
  )
}

export default memo(ThreatNode)
