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

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; border: string; iconColor: string }
> = {
  database: {
    icon: <Database className="h-4 w-4" />,
    border: "border-green-500",
    iconColor: "text-green-400",
  },
  service: {
    icon: <Server className="h-4 w-4" />,
    border: "border-blue-500",
    iconColor: "text-blue-400",
  },
  web_app: {
    icon: <Globe className="h-4 w-4" />,
    border: "border-purple-500",
    iconColor: "text-purple-400",
  },
  auth: {
    icon: <Shield className="h-4 w-4" />,
    border: "border-red-500",
    iconColor: "text-red-400",
  },
  gateway: {
    icon: <Network className="h-4 w-4" />,
    border: "border-orange-500",
    iconColor: "text-orange-400",
  },
  queue: {
    icon: <Package className="h-4 w-4" />,
    border: "border-yellow-500",
    iconColor: "text-yellow-400",
  },
  storage: {
    icon: <Archive className="h-4 w-4" />,
    border: "border-blue-400",
    iconColor: "text-blue-300",
  },
  external: {
    icon: <ExternalLink className="h-4 w-4" />,
    border: "border-slate-500",
    iconColor: "text-slate-400",
  },
}

const DEFAULT_CONFIG = {
  icon: <Box className="h-4 w-4" />,
  border: "border-slate-600",
  iconColor: "text-slate-400",
}

function ComponentNode({ data }: NodeProps<ComponentNodeData>) {
  const type = data.component_type ?? "other"
  const config = TYPE_CONFIG[type] ?? DEFAULT_CONFIG

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!border-slate-600 !bg-slate-700 !w-2 !h-2"
      />
      <div
        className={`rounded-lg border-2 ${config.border} bg-slate-900 px-4 py-3 min-w-[160px] max-w-[200px] shadow-lg`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className={config.iconColor}>{config.icon}</span>
          <span className="text-slate-100 font-semibold text-sm leading-tight truncate">
            {data.label}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {type.replace(/_/g, " ")}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!border-slate-600 !bg-slate-700 !w-2 !h-2"
      />
    </>
  )
}

export default memo(ComponentNode)
