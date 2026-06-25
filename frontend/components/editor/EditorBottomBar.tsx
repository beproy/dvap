"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const FIELD_CLS =
  "bg-surface-base border-border-subtle text-text-primary placeholder:text-text-disabled"

const LABEL_STYLE = {
  fontSize: "var(--text-xs)",
  letterSpacing: "var(--tracking-wider)",
}

interface EditorBottomBarProps {
  systemName: string
  systemDescription: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  isSaving?: boolean
}

export default function EditorBottomBar({
  systemName,
  systemDescription,
  onNameChange,
  onDescriptionChange,
  onSave,
  isSaving = false,
}: EditorBottomBarProps) {
  return (
    <div className="flex items-end gap-4 px-4 py-3">
      <div className="flex flex-col gap-1 min-w-0 flex-1 max-w-xs">
        <label
          className="text-text-tertiary uppercase font-medium"
          style={LABEL_STYLE}
        >
          System name
        </label>
        <Input
          value={systemName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Customer Portal"
          maxLength={100}
          disabled={isSaving}
          className={`${FIELD_CLS} h-9 text-sm`}
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <label
          className="text-text-tertiary uppercase font-medium"
          style={LABEL_STYLE}
        >
          Description
        </label>
        <Textarea
          value={systemDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of the system (10-500 chars)..."
          maxLength={500}
          rows={1}
          disabled={isSaving}
          className={`${FIELD_CLS} text-sm min-h-0 resize-none py-2`}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0 pb-0.5">
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary transition-colors"
          style={{ fontSize: "var(--text-sm)" }}
          aria-disabled={isSaving}
        >
          Cancel
        </Link>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-bright text-surface-base font-medium transition-colors disabled:opacity-50 min-w-[96px] justify-center"
          style={{ fontSize: "var(--text-sm)" }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save System"
          )}
        </button>
      </div>
    </div>
  )
}
