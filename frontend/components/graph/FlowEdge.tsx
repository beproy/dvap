"use client"

import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow"
import { Lock } from "lucide-react"

type FlowEdgeData = {
  protocol?: string
  is_encrypted?: boolean
}

function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<FlowEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const protocol = data?.protocol
  const isEncrypted = data?.is_encrypted

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "var(--border-default)", strokeWidth: 1 }}
      />
      {protocol && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className="flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{
                background:  "var(--surface-raised)",
                border:      "0.5px solid var(--border-subtle)",
                fontFamily:  "var(--font-mono)",
                fontSize:    "var(--text-xs)",
                color:       "var(--text-tertiary)",
              }}
            >
              {isEncrypted && (
                <Lock
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                />
              )}
              <span>{protocol}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(FlowEdge)
