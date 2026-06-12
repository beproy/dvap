"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSystemRuns } from "@/hooks/useSystemRuns"
import FindingsView from "@/components/findings/FindingsView"
import AnalysisRunner from "@/components/runs/AnalysisRunner"

function FindingsContent({ id }: { id: string }) {
  const searchParams = useSearchParams()
  const requestedRunId = searchParams.get("run_id")
  const [showRunner, setShowRunner] = useState(false)

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
          Failed to load analysis runs: {error.message}
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

  const completedRuns = (runs ?? []).filter((r) => r.status === "completed")
  const targetRun = requestedRunId
    ? (runs ?? []).find((r) => r.run_id === requestedRunId)
    : completedRuns[0]

  if (!targetRun || showRunner) {
    return (
      <div className="space-y-6 max-w-2xl">
        {showRunner && targetRun && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">New Analysis</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRunner(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Back to findings
            </Button>
          </div>
        )}
        <AnalysisRunner systemId={id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRunner(true)}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Run new analysis
        </Button>
      </div>
      <FindingsView runId={targetRun.run_id} systemId={id} />
    </div>
  )
}

export default function FindingsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      }
    >
      <FindingsContent id={params.id} />
    </Suspense>
  )
}
