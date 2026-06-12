"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Circle, Loader2, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startAnalysis, getAnalysisFindings } from "@/lib/api"
import { useAnalysisRun } from "@/hooks/useAnalysisRun"
import RunStatusBadge from "./RunStatusBadge"
import RunTimings from "./RunTimings"
import type { AnalysisFindings } from "@/lib/types"

const AGENTS = [
  { key: "stride", label: "STRIDE" },
  { key: "maestro", label: "MAESTRO" },
  { key: "attack", label: "ATT&CK Mapping" },
  { key: "attack_tree", label: "Attack Tree" },
  { key: "controls", label: "Controls" },
]

function formatElapsed(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

interface Props {
  systemId: string
}

export default function AnalysisRunner({ systemId }: Props) {
  const [runId, setRunId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  // Tick triggers re-renders for the live elapsed counter.
  const [, setTick] = useState(0)

  const { data: run, error: runError, mutate: mutateRun } = useAnalysisRun(runId)

  const isActive =
    run != null && (run.status === "pending" || run.status === "running")

  // Poll findings while run is active so per-agent timings appear as they land.
  const { data: findings } = useSWR<AnalysisFindings>(
    runId ? `/api/analyses/${runId}/findings` : null,
    runId ? () => getAnalysisFindings(runId) : null,
    { refreshInterval: isActive ? 3000 : 0, revalidateOnFocus: false }
  )

  // Increment tick every second while active to keep the elapsed counter live.
  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isActive])

  const elapsedSeconds = run?.started_at
    ? Math.floor(
        (Date.now() - new Date(run.started_at).getTime()) / 1000
      )
    : 0

  async function handleStart() {
    setIsStarting(true)
    setStartError(null)
    try {
      const response = await startAnalysis(systemId)
      setRunId(response.run_id)
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Failed to start analysis"
      )
    } finally {
      setIsStarting(false)
    }
  }

  function handleReset() {
    setRunId(null)
    setStartError(null)
  }

  // ── No run in this session ────────────────────────────────────────────────
  if (!runId) {
    return (
      <div className="space-y-3">
        <Button size="lg" onClick={handleStart} disabled={isStarting} className="gap-2">
          {isStarting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isStarting ? "Starting..." : "Run Analysis"}
        </Button>
        {startError && (
          <p className="text-sm text-red-400">{startError}</p>
        )}
      </div>
    )
  }

  // ── Run ID set, never received data, and poll failed (e.g. network down) ──
  if (!run && runError) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not reach the analysis server.
        </div>
        <p className="text-xs text-slate-500">{runError.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutateRun()}
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // ── Run ID set but status not yet received ────────────────────────────────
  if (!run) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Starting analysis...
      </div>
    )
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (run.status === "completed") {
    const durationSeconds =
      run.completed_at && run.started_at
        ? Math.floor(
            (new Date(run.completed_at).getTime() -
              new Date(run.started_at).getTime()) /
              1000
          )
        : null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <RunStatusBadge status={run.status} />
          {durationSeconds !== null && (
            <span className="text-sm text-slate-400">
              Finished in {formatElapsed(durationSeconds)}
            </span>
          )}
        </div>
        {findings?.timings && Object.keys(findings.timings).length > 0 && (
          <RunTimings timings={findings.timings} />
        )}
        <div className="flex gap-2 pt-1">
          <Button asChild>
            <Link href={`/systems/${systemId}/findings`}>View Findings</Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Run Again
          </Button>
        </div>
      </div>
    )
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (run.status === "failed") {
    return (
      <div className="space-y-4">
        <RunStatusBadge status={run.status} />
        {run.error_message && (
          <p className="text-sm text-red-400">{run.error_message}</p>
        )}
        <Button
          variant="outline"
          onClick={handleReset}
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  // ── Pending or running ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <RunStatusBadge status={run.status} />
        <span className="text-sm text-slate-400 tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>
      {runError && (
        <div className="flex items-center gap-2 rounded-md border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Connection interrupted - retrying automatically</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutateRun()}
            className="h-5 px-2 text-xs text-amber-400 hover:text-amber-200 hover:bg-amber-900/40"
          >
            Retry now
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {AGENTS.map(({ key, label }) => {
          const timing = findings?.timings?.[key]
          const done = timing !== undefined
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-700 shrink-0" />
              )}
              <span className={done ? "text-slate-300" : "text-slate-500"}>
                {label}
              </span>
              {done && (
                <span className="text-xs text-slate-500 tabular-nums ml-auto">
                  {timing.toFixed(1)}s
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
