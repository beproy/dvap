"use client"

import {
  Globe,
  Server,
  Network,
  Database,
  Shield,
  Layers,
  HardDrive,
  ExternalLink,
  Box,
  type LucideIcon,
} from "lucide-react"
import { Card } from "@/components/ui/card"

interface PaletteItem {
  type: string
  label: string
  description: string
  Icon: LucideIcon
}

const COMPONENT_TYPES: PaletteItem[] = [
  { type: "web_app",  label: "Web App",        description: "Browser-facing application",      Icon: Globe },
  { type: "service",  label: "Service",         description: "Internal backend microservice",    Icon: Server },
  { type: "gateway",  label: "API Gateway",     description: "Entry point for API traffic",      Icon: Network },
  { type: "database", label: "Database",        description: "Structured data store",            Icon: Database },
  { type: "auth",     label: "Auth Provider",   description: "Authentication and authorization", Icon: Shield },
  { type: "queue",    label: "Queue",           description: "Async message or task queue",      Icon: Layers },
  { type: "storage",  label: "Storage",         description: "File or object storage",           Icon: HardDrive },
  { type: "external", label: "External System", description: "Third-party or partner service",   Icon: ExternalLink },
  { type: "other",    label: "Other",           description: "Custom component type",            Icon: Box },
]

function handleDragStart(event: React.DragEvent, componentType: string) {
  event.dataTransfer.setData(
    "application/reactflow",
    JSON.stringify({ type: componentType })
  )
  event.dataTransfer.effectAllowed = "move"
}

export default function ComponentPalette() {
  return (
    <div className="p-3 flex flex-col gap-1.5">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-medium px-1 pt-1 pb-1">
        Components
      </p>
      {COMPONENT_TYPES.map(({ type, label, description, Icon }) => (
        <Card
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          className="flex items-start gap-3 px-3 py-2.5 border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800 transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <Icon className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-slate-200 leading-none mb-0.5">{label}</p>
            <p className="text-xs text-slate-500 leading-snug">{description}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
