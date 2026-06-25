"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { mutate } from "swr"
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
      mutate("/api/systems")
    } catch {
      mutate("/api/systems")
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <div
        onClick={() => router.push(`/systems/${system.system_id}`)}
        className="cursor-pointer rounded-lg border border-border-subtle bg-surface-raised hover:border-border-default transition-colors relative group"
        style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--easing-default)" }}
      >
        <div className="p-5 flex flex-col gap-3">
          {/* Name row with delete button */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-text-primary font-medium leading-snug"
              style={{ fontSize: "var(--text-md)" }}
            >
              {system.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmOpen(true)
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-severity-critical transition-all p-1 rounded focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
              style={{ transitionDuration: "var(--duration-normal)" }}
              aria-label="Delete system"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Description */}
          {truncated && (
            <p
              className="text-text-secondary leading-relaxed"
              style={{ fontSize: "var(--text-sm)" }}
            >
              {truncated}
            </p>
          )}

          {/* Meta row */}
          <p
            className="text-text-tertiary"
            style={{ fontSize: "var(--text-xs)" }}
          >
            {system.component_count}{" "}
            {system.component_count === 1 ? "component" : "components"}
            {" "}&middot;{" "}
            created {formatRelativeTime(system.created_at)}
          </p>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete system?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-text-primary">{system.name}</span>{" "}
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
