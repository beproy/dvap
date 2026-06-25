"use client"

import { useState, useEffect, useRef } from "react"
import { X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  // Reset confirm state when the selection changes
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
      className={`absolute top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-800 flex flex-col z-10 transition-transform duration-200 ease-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-slate-800 shrink-0">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">
          {selectedNode ? "Component" : "Data Flow"}
        </span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
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
              <label className="text-xs text-slate-500 uppercase tracking-wider">Name</label>
              <Input
                value={(selectedNode.data?.label as string) ?? ""}
                onChange={(e) => onNodeNameChange(e.target.value)}
                maxLength={100}
                className="bg-slate-950 border-slate-700 text-slate-100 h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Type</label>
              <div className="px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-sm text-slate-500 select-none">
                {TYPE_LABELS[nodeType] ?? "Other"}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Description</label>
              <Textarea
                value={descValue}
                onChange={(e) => onNodeDescriptionChange(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="What does this component do?"
                className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
              />
              <span className="text-xs text-slate-600 text-right tabular-nums">
                {descValue.length}/500
              </span>
            </div>
          </>
        )}

        {selectedEdge && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Source</label>
              <div className="px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-sm text-slate-500 truncate select-none">
                {sourceNodeName || selectedEdge.source}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Destination</label>
              <div className="px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-sm text-slate-500 truncate select-none">
                {destNodeName || selectedEdge.target}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Data type</label>
              <Input
                value={(selectedEdge.data?.data_type as string) ?? ""}
                onChange={(e) => onEdgeDataTypeChange(e.target.value)}
                placeholder="e.g. JWT tokens"
                className="bg-slate-950 border-slate-700 text-slate-100 h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Protocol</label>
              <Input
                value={(selectedEdge.data?.protocol as string) ?? ""}
                onChange={(e) => onEdgeProtocolChange(e.target.value)}
                placeholder="e.g. HTTPS"
                className="bg-slate-950 border-slate-700 text-slate-100 h-8 text-sm"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={(selectedEdge.data?.is_encrypted as boolean) ?? false}
                onChange={(e) => onEdgeEncryptedChange(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-300">Encrypted</span>
            </label>
          </>
        )}

      </div>

      {/* Delete footer */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-slate-800 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className={`w-full gap-1.5 text-xs transition-colors ${
              confirmDelete
                ? "text-red-400 border border-red-900 hover:bg-red-950/40 hover:text-red-300"
                : "text-slate-500 hover:text-red-400 hover:bg-transparent"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete
              ? `Confirm delete ${selectedNode ? "component" : "flow"}`
              : `Delete ${selectedNode ? "component" : "flow"}`}
          </Button>
        </div>
      )}
    </div>
  )
}
