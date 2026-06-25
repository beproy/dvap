"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

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
        <label className="text-xs text-slate-400 uppercase tracking-wider">System name</label>
        <Input
          value={systemName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Customer Portal"
          maxLength={100}
          disabled={isSaving}
          className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 h-9 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <label className="text-xs text-slate-400 uppercase tracking-wider">Description</label>
        <Textarea
          value={systemDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of the system (10-500 chars)..."
          maxLength={500}
          rows={1}
          disabled={isSaving}
          className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 text-sm min-h-0 resize-none py-2"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0 pb-0.5">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:text-slate-100"
          disabled={isSaving}
        >
          <Link href="/">Cancel</Link>
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="bg-slate-700 hover:bg-slate-600 text-slate-100 min-w-[96px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save System"
          )}
        </Button>
      </div>
    </div>
  )
}
