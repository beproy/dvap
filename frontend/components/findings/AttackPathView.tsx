"use client"

import { useState } from "react"
import { ArrowRight, Play, Pause, RotateCcw, Maximize2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AttackPath } from "@/lib/types"
import { useStoryModePlayer } from "@/hooks/useStoryModePlayer"
import type { StorySpeed } from "@/hooks/useStoryModePlayer"
import PresentationMode from "./PresentationMode"

function mitreUrl(id: string): string {
  if (id.includes(".")) {
    const dotIndex = id.indexOf(".")
    return `https://attack.mitre.org/techniques/${id.slice(0, dotIndex)}/${id.slice(dotIndex + 1)}/`
  }
  return `https://attack.mitre.org/techniques/${id}/`
}

const SEVERITY_CLASSES: Record<string, string> = {
  Low: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  Medium: "bg-orange-900/40 text-orange-300 border-orange-800",
  High: "bg-red-900/40 text-red-300 border-red-800",
  Critical: "bg-red-950/80 text-red-200 border-red-500",
}

const STEP_TRANSITION = "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)"

interface Props {
  path: AttackPath
}

export default function AttackPathView({ path }: Props) {
  const sorted = [...path.steps].sort((a, b) => a.sequence - b.sequence)
  const { currentStep, isPlaying, speed, play, pause, restart, setSpeed } =
    useStoryModePlayer(sorted)

  // Gate that separates "never played" (full opacity everywhere) from
  // "playback started" (revealed = full, unrevealed = dimmed).
  const [hasStarted, setHasStarted] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)

  const atEnd = sorted.length > 0 && currentStep >= sorted.length - 1

  function handlePlay() {
    setHasStarted(true)
    play()
  }

  function handleRestart() {
    setHasStarted(true)
    // restart() sets step=0 and pauses; play() then starts from 0.
    // React 18 batches both; net state: currentStep=0, isPlaying=true.
    restart()
    play()
  }

  // Arrow at position i connects step i-1 to step i; it fades in with step i.
  function revealedAt(i: number): boolean {
    return !hasStarted || i <= currentStep
  }

  const showControls = sorted.length > 1

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4 space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-3">
        <Badge
          className={cn(
            "shrink-0",
            SEVERITY_CLASSES[path.severity] ?? SEVERITY_CLASSES["Medium"]
          )}
        >
          {path.severity}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-100 text-sm">{path.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{path.objective}</p>
        </div>

        {sorted.length > 0 && (
          <button
            onClick={() => setIsPresenting(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            title="Full-screen presentation"
          >
            <Maximize2 className="w-3 h-3" />
            Present
          </button>
        )}

        {showControls && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Speed selector */}
            <div className="flex rounded overflow-hidden border border-slate-700">
              {(["slow", "normal", "fast"] as StorySpeed[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "px-2 py-0.5 text-xs transition-colors",
                    speed === s
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  )}
                >
                  {s === "slow" ? "0.5x" : s === "normal" ? "1x" : "2x"}
                </button>
              ))}
            </div>

            {/* Restart -- visible once playback has started and not yet at end */}
            {hasStarted && !atEnd && (
              <button
                onClick={handleRestart}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Restart from step 1"
              >
                <RotateCcw className="w-3 h-3" />
                Restart
              </button>
            )}

            {/* Play / Pause / Replay */}
            {!hasStarted ? (
              <button
                onClick={handlePlay}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-cyan-800 text-cyan-300 hover:bg-cyan-950/50 transition-colors"
              >
                <Play className="w-3 h-3" />
                Play
              </button>
            ) : isPlaying ? (
              <button
                onClick={pause}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Pause className="w-3 h-3" />
                Pause
              </button>
            ) : atEnd ? (
              <button
                onClick={handlePlay}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Replay
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-cyan-800 text-cyan-300 hover:bg-cyan-950/50 transition-colors"
              >
                <Play className="w-3 h-3" />
                Play
              </button>
            )}
          </div>
        )}
      </div>

      {/* Steps */}
      {sorted.length > 0 && (
        <div className="flex items-start gap-1 overflow-x-auto pb-1">
          {sorted.map((step, i) => (
            <div key={step.sequence} className="flex items-start gap-1 shrink-0">
              {i > 0 && (
                <div
                  style={{
                    opacity: revealedAt(i) ? 1 : 0.2,
                    transition: STEP_TRANSITION,
                  }}
                >
                  <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 mt-3" />
                </div>
              )}
              <div
                className="rounded border border-slate-700 bg-slate-900 p-2.5 w-[150px]"
                style={{
                  opacity: revealedAt(i) ? 1 : 0.2,
                  transition: STEP_TRANSITION,
                }}
              >
                <a
                  href={mitreUrl(step.technique_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Badge className="bg-blue-900/40 text-blue-300 border-blue-800 hover:bg-blue-800/60 text-xs mb-1.5">
                    {step.technique_id}
                  </Badge>
                </a>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPresenting && (
        <PresentationMode path={path} onClose={() => setIsPresenting(false)} />
      )}
    </div>
  )
}
