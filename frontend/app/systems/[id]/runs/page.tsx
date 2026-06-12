"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSystemRuns } from "@/hooks/useSystemRuns"
import RunStatusBadge from "@/components/runs/RunStatusBadge"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "In progress"
  const seconds = Math.floor(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
  )
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function RunsContent({ id }: { id: string }) {
  const router = useRouter()
  const { data: runs, isLoading, error, mutate } = useSystemRuns(id)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading runs...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 py-4">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load runs: {error.message}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  if (!runs || runs.length === 0) {
    return (
      <p className="text-slate-400 text-sm py-8 text-center">
        No analysis runs yet. Go to the Findings tab to start one.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Started
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Model
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {runs.map((run) => (
            <tr
              key={run.run_id}
              onClick={() =>
                router.push(`/systems/${id}/findings?run_id=${run.run_id}`)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  router.push(`/systems/${id}/findings?run_id=${run.run_id}`)
                }
              }}
              tabIndex={0}
              className="hover:bg-slate-800/40 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-slate-800/60"
            >
              <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                {formatDate(run.started_at)}
              </td>
              <td className="px-4 py-3">
                <RunStatusBadge status={run.status} />
              </td>
              <td className="px-4 py-3 text-slate-400 tabular-nums text-xs">
                {formatDuration(run.started_at, run.completed_at)}
              </td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                {run.llm_model}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function RunsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      }
    >
      <RunsContent id={params.id} />
    </Suspense>
  )
}
