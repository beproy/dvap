"use client"

import { useState, useEffect, useRef } from "react"
import { X, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Node, Edge } from "reactflow"

const TYPE_LABELS: Record<string, string> = {
  web_app:  "Web App",
  service:  "Service",
  gateway:  "API Gateway",
  database: "Database",
  auth:     "Auth Provider",
  queue:    "Queue",
  storage:  "Storage",
  external: "External System",
  other:    "Other",
}

const FIELD_CLS =
  "bg-surface-base border-border-subtle text-text-primary placeholder:text-text-disabled h-8 text-sm"

const LABEL_STYLE = {
  fontSize: "var(--text-xs)",
  letterSpacing: "var(--tracking-widest, 0.12em)",
}

interface PropertyPanelProps {
  selectedNode: Node | null
  selectedEdge: Edge | null
  sourceNodeName: string
  destNodeName: string
  onNodeNameChange: (name: string) => void
  onNodeDescriptionChange: (desc: string) => void
  onEdgeDataTypeChange: (val: string) => void
  onEdgeProtocolChange: (val: string) => void
  onEdgeEncryptedChange: (val: boolean) => void
  onDeleteNode: () => void
  onDeleteEdge: () => void
  onClose: () => void
}

export default function PropertyPanel({
  selectedNode,
  selectedEdge,
  sourceNodeName,
  destNodeName,
  onNodeNameChange,
  onNodeDescriptionChange,
  onEdgeDataTypeChange,
  onEdgeProtocolChange,
  onEdgeEncryptedChange,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}: PropertyPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOpen = selectedNode !== null || selectedEdge !== null

  const selectedNodeId = selectedNode?.id
  const selectedEdgeId = selectedEdge?.id
  useEffect(() => {
    setConfirmDelete(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [selectedNodeId, selectedEdgeId])

  function handleDeleteClick() {
    if (confirmDelete) {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (selectedNode) onDeleteNode()
      else onDeleteEdge()
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const nodeType = (selectedNode?.data?.component_type as string | undefined) ?? "other"
  const descValue = (selectedNode?.data?.description as string) ?? ""

  return (
    <div
      className={`absolute top-0 right-0 h-full w-72 bg-surface-elevated flex flex-col z-10 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{
        borderLeft: "0.5px solid var(--border-subtle)",
        transition: `transform var(--duration-normal) var(--easing-default)`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-11 shrink-0"
        style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
      >
        <span
          className="text-text-tertiary uppercase font-medium"
          style={LABEL_STYLE}
        >
          {selectedNode ? "Component" : "Data Flow"}
        </span>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-secondary p-1 rounded transition-colors"
          aria-label="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {selectedNode && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Name
              </label>
              <Input
                value={(selectedNode.data?.label as string) ?? ""}
                onChange={(e) => onNodeNameChange(e.target.value)}
                maxLength={100}
                className={FIELD_CLS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Type
              </label>
              <div
                className="px-2.5 py-1.5 rounded text-text-tertiary select-none"
                style={{
                  border: "0.5px solid var(--border-subtle)",
                  background: "var(--surface-base)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {TYPE_LABELS[nodeType] ?? "Other"}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Description
              </label>
              <Textarea
                value={descValue}
                onChange={(e) => onNodeDescriptionChange(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="What does this component do?"
                className="bg-surface-base border-border-subtle text-text-primary placeholder:text-text-disabled text-sm resize-none"
              />
              <span
                className="text-text-disabled text-right tabular-nums"
                style={{ fontSize: "var(--text-xs)" }}
              >
                {descValue.length}/500
              </span>
            </div>
          </>
        )}

        {selectedEdge && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Source
              </label>
              <div
                className="px-2.5 py-1.5 rounded text-text-tertiary truncate select-none"
                style={{
                  border: "0.5px solid var(--border-subtle)",
                  background: "var(--surface-base)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {sourceNodeName || selectedEdge.source}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Destination
              </label>
              <div
                className="px-2.5 py-1.5 rounded text-text-tertiary truncate select-none"
                style={{
                  border: "0.5px solid var(--border-subtle)",
                  background: "var(--surface-base)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {destNodeName || selectedEdge.target}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Data type
              </label>
              <Input
                value={(selectedEdge.data?.data_type as string) ?? ""}
                onChange={(e) => onEdgeDataTypeChange(e.target.value)}
                placeholder="e.g. JWT tokens"
                className={FIELD_CLS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-tertiary uppercase font-medium" style={LABEL_STYLE}>
                Protocol
              </label>
              <Input
                value={(selectedEdge.data?.protocol as string) ?? ""}
                onChange={(e) => onEdgeProtocolChange(e.target.value)}
                placeholder="e.g. HTTPS"
                className={FIELD_CLS}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={(selectedEdge.data?.is_encrypted as boolean) ?? false}
                onChange={(e) => onEdgeEncryptedChange(e.target.checked)}
                className="w-4 h-4 rounded border-border-subtle bg-surface-base cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="text-text-secondary" style={{ fontSize: "var(--text-sm)" }}>
                Encrypted
              </span>
            </label>
          </>
        )}

      </div>

      {/* Delete footer */}
      {isOpen && (
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: "0.5px solid var(--border-subtle)" }}
        >
          <button
            onClick={handleDeleteClick}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors ${
              confirmDelete
                ? "border border-border-subtle bg-surface-base"
                : "text-text-tertiary hover:text-severity-critical"
            }`}
            style={{
              fontSize: "var(--text-xs)",
              color: confirmDelete ? "var(--severity-critical)" : undefined,
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete
              ? `Confirm delete ${selectedNode ? "component" : "flow"}`
              : `Delete ${selectedNode ? "component" : "flow"}`}
          </button>
        </div>
      )}
    </div>
  )
}
