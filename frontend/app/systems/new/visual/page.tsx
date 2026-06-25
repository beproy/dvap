"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, X } from "lucide-react"
import EditorLayout from "@/components/editor/EditorLayout"
import ComponentPalette from "@/components/editor/ComponentPalette"
import EditorCanvas, { type CanvasHandle } from "@/components/editor/EditorCanvas"
import EditorBottomBar from "@/components/editor/EditorBottomBar"
import { validateEditorState } from "@/lib/editor-validation"
import { createSystem } from "@/lib/api"
import type { ComponentType } from "@/lib/types"

export default function VisualEditorPage() {
  const router = useRouter()
  const canvasRef = useRef<CanvasHandle>(null)
  const [systemName, setSystemName] = useState("")
  const [systemDescription, setSystemDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function handleSave() {
    setErrors([])

    const { nodes, edges } = canvasRef.current?.getCanvasData() ?? { nodes: [], edges: [] }

    const validation = validateEditorState({ systemName, systemDescription, nodes, edges })
    if (validation.valid === false) {
      setErrors(validation.errors)
      return
    }

    // Build a nodeId -> name map so edges can reference component names
    const nameById = new Map(
      nodes.map((n) => [n.id, (n.data?.label as string ?? "").trim()])
    )

    const request = {
      name: systemName.trim(),
      description: systemDescription.trim(),
      components: nodes.map((n) => ({
        name: (n.data?.label as string ?? "").trim(),
        type: ((n.data?.component_type as ComponentType | undefined) ?? "other"),
        description: ((n.data?.description as string | undefined) ?? "").trim(),
      })),
      data_flows: edges.map((e) => ({
        source:       nameById.get(e.source) ?? e.source,
        destination:  nameById.get(e.target) ?? e.target,
        data_type:    (e.data?.data_type as string | undefined)    ?? "",
        protocol:     (e.data?.protocol   as string | undefined)   ?? "",
        is_encrypted: (e.data?.is_encrypted as boolean | undefined) ?? false,
      })),
    }

    setIsSaving(true)
    try {
      const result = await createSystem(request)
      router.push(`/systems/${result.system_id}/architecture`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save system."
      setErrors([message])
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          New System / Visual Editor
        </p>
        <h1 className="text-xl font-semibold text-slate-100 mt-0.5">Visual System Editor</h1>
      </div>

      {errors.length > 0 && (
        <div className="mb-3 flex items-start gap-3 px-4 py-3 bg-red-950/40 border border-red-900/60 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <ul className="flex-1 min-w-0 space-y-0.5">
            {errors.map((msg, i) => (
              <li key={i} className="text-sm text-red-300">{msg}</li>
            ))}
          </ul>
          <button
            onClick={() => setErrors([])}
            className="text-red-500 hover:text-red-300 p-0.5 rounded transition-colors"
            aria-label="Dismiss errors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <EditorLayout
        palette={<ComponentPalette />}
        canvas={<EditorCanvas ref={canvasRef} />}
        bottomBar={
          <EditorBottomBar
            systemName={systemName}
            systemDescription={systemDescription}
            onNameChange={setSystemName}
            onDescriptionChange={setSystemDescription}
            onSave={handleSave}
            isSaving={isSaving}
          />
        }
      />
    </div>
  )
}
