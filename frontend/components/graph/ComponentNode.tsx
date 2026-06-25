"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import {
  Database,
  Server,
  Globe,
  Shield,
  Network,
  Package,
  Archive,
  ExternalLink,
  Box,
} from "lucide-react"

type ComponentNodeData = {
  label: string
  component_type?: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  database: <Database className="h-3.5 w-3.5" />,
  service:  <Server className="h-3.5 w-3.5" />,
  web_app:  <Globe className="h-3.5 w-3.5" />,
  auth:     <Shield className="h-3.5 w-3.5" />,
  gateway:  <Network className="h-3.5 w-3.5" />,
  queue:    <Package className="h-3.5 w-3.5" />,
  storage:  <Archive className="h-3.5 w-3.5" />,
  external: <ExternalLink className="h-3.5 w-3.5" />,
}

const DEFAULT_ICON = <Box className="h-3.5 w-3.5" />

function ComponentNode({ data, selected }: NodeProps<ComponentNodeData>) {
  const type = data.component_type ?? "other"
  const icon = TYPE_ICON[type] ?? DEFAULT_ICON

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!border-border-default !bg-surface-elevated !w-2 !h-2"
      />
      <div
        className="rounded-lg bg-surface-raised px-4 py-3 min-w-[160px] max-w-[200px]"
        style={{
          border: selected
            ? "1px solid var(--accent)"
            : "0.5px solid var(--border-subtle)",
          transition: `border-color var(--duration-fast) var(--easing-default)`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-text-secondary shrink-0">{icon}</span>
          <span
            className="text-text-primary font-medium leading-tight truncate"
            style={{ fontSize: "var(--text-base)" }}
          >
            {data.label}
          </span>
        </div>
        <span
          className="text-text-tertiary uppercase font-medium"
          style={{
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {type.replace(/_/g, " ")}
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

export default memo(ComponentNode)
