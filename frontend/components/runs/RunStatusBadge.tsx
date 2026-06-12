"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RunStatus } from "@/lib/types"

const STATUS_CONFIG: Record<RunStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-slate-700 text-slate-300 border-slate-600",
  },
  running: {
    label: "Running",
    className:
      "bg-blue-900/60 text-blue-300 border-blue-700 animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-green-900/60 text-green-300 border-green-700",
  },
  failed: {
    label: "Failed",
    className: "bg-red-900/60 text-red-300 border-red-700",
  },
}

interface Props {
  status: RunStatus
  className?: string
}

export default function RunStatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge className={cn(config.className, className)}>{config.label}</Badge>
  )
}
