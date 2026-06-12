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
        style={{ stroke: "#475569", strokeWidth: 1.5 }}
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
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-400">
              {isEncrypted && <Lock className="h-2.5 w-2.5 text-green-400 shrink-0" />}
              <span>{protocol}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(FlowEdge)
