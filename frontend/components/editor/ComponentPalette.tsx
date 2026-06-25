"use client"

import { useState } from "react"
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

export default function ComponentPalette() {
  const [draggingType, setDraggingType] = useState<string | null>(null)

  function handleDragStart(event: React.DragEvent, componentType: string) {
    setDraggingType(componentType)
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type: componentType })
    )
    event.dataTransfer.effectAllowed = "move"
  }

  function handleDragEnd() {
    setDraggingType(null)
  }

  return (
    <div className="p-3 flex flex-col gap-1.5">
      <p
        className="text-text-tertiary uppercase font-medium px-1 pt-1 pb-1"
        style={{
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-widest, 0.12em)",
        }}
      >
        Components
      </p>
      {COMPONENT_TYPES.map(({ type, label, description, Icon }) => {
        const isDragging = draggingType === type
        return (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onDragEnd={handleDragEnd}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface-raised transition-colors cursor-grab active:cursor-grabbing select-none"
            style={{
              border: isDragging
                ? "1px solid var(--accent)"
                : "0.5px solid var(--border-subtle)",
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                (e.currentTarget as HTMLDivElement).style.border =
                  "0.5px solid var(--border-default)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                (e.currentTarget as HTMLDivElement).style.border =
                  "0.5px solid var(--border-subtle)"
              }
            }}
          >
            <Icon
              className="w-3.5 h-3.5 mt-0.5 text-text-secondary shrink-0"
            />
            <div className="min-w-0">
              <p
                className="text-text-primary leading-none mb-0.5"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {label}
              </p>
              <p
                className="text-text-tertiary leading-snug"
                style={{ fontSize: "var(--text-xs)" }}
              >
                {description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
