"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Layers, Clock } from "lucide-react"
import { mutate } from "swr"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteSystem } from "@/lib/api"
import { formatRelativeTime } from "@/lib/utils"
import type { SystemSummary } from "@/lib/types"

interface Props {
  system: SystemSummary
}

export default function SystemCard({ system }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const description = system.description ?? ""
  const truncated =
    description.length > 100 ? description.slice(0, 97) + "..." : description

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteSystem(system.system_id)
      // Refresh the systems list cache
      mutate("/api/systems")
    } catch {
      // System may already be gone; re-fetch to sync state
      mutate("/api/systems")
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <Card
        onClick={() => router.push(`/systems/${system.system_id}`)}
        className="cursor-pointer hover:border-slate-600 transition-colors relative group"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-100 leading-tight">
              {system.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmOpen(true)
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Delete system"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {truncated && (
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              {truncated}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {system.component_count}{" "}
              {system.component_count === 1 ? "component" : "components"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeTime(system.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete system?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-slate-200">{system.name}</span>{" "}
              and all of its analysis runs. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
