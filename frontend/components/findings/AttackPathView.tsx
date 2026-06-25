"use client"

import { useRef, useEffect, useState } from "react"
import { ArrowRight, Play, Pause, RotateCcw, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttackPath, AttackPathStep } from "@/lib/types"
import { useStoryModePlayer } from "@/hooks/useStoryModePlayer"
import type { StorySpeed } from "@/hooks/useStoryModePlayer"
import PresentationMode from "./PresentationMode"

const SEVERITY_COLORS: Record<string, string> = {
  Low:      "var(--severity-low)",
  Medium:   "var(--severity-medium)",
  High:     "var(--severity-high)",
  Critical: "var(--severity-critical)",
}

interface StepCardProps {
  step: AttackPathStep
  index: number
  currentStep: number
  isRevealed: boolean
  hasStarted: boolean
}

function StepCard({ step, index, currentStep, isRevealed, hasStarted }: StepCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Retrigger lift animation each time this card becomes the newly revealed step
  useEffect(() => {
    if (!hasStarted || index !== currentStep || !cardRef.current) return
    const el = cardRef.current
    el.classList.remove("step-just-revealed")
    void el.offsetWidth // force reflow so browser re-fires the animation
    el.classList.add("step-just-revealed")
  }, [currentStep, hasStarted, index])

  return (
    <div
      ref={cardRef}
      className="rounded-lg bg-surface-raised p-2.5 w-[168px] space-y-1.5"
      style={{
        border:     "0.5px solid var(--border-subtle)",
        opacity:    isRevealed ? 1 : 0.2,
        transition: `opacity var(--duration-normal) var(--easing-default)`,
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded bg-surface-elevated text-text-tertiary"
        style={{
          fontSize:   "var(--text-xs)",
          padding:    "1px 5px",
          minWidth:   22,
          fontFamily: "var(--font-mono)",
        }}
      >
        {String(step.sequence).padStart(2, "0")}
      </span>
      <p
        className="text-text-primary"
        style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
      >
        {step.technique_id}
      </p>
      <p
        className="text-text-secondary"
        style={{ fontSize: "var(--text-sm)", lineHeight: 1.5 }}
      >
        {step.description}
      </p>
    </div>
  )
}

interface Props {
  path: AttackPath
}

export default function AttackPathView({ path }: Props) {
  const sorted = [...path.steps].sort((a, b) => a.sequence - b.sequence)
  const { currentStep, isPlaying, speed, play, pause, restart, setSpeed } =
    useStoryModePlayer(sorted)

  const [hasStarted, setHasStarted] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)

  const atEnd = sorted.length > 0 && currentStep >= sorted.length - 1
  const severityColor = SEVERITY_COLORS[path.severity] ?? SEVERITY_COLORS["Medium"]

  function handlePlay() {
    setHasStarted(true)
    play()
  }

  function handleRestart() {
    setHasStarted(true)
    restart()
    play()
  }

  function revealedAt(i: number): boolean {
    return !hasStarted || i <= currentStep
  }

  const showControls = sorted.length > 1

  const ctrlBtn = cn(
    "flex items-center gap-1 px-2 py-1 rounded border transition-colors",
    "border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-default"
  )

  return (
    <div
      className="rounded-lg bg-surface-raised p-4 space-y-3"
      style={{ border: "0.5px solid var(--border-subtle)" }}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-3">
        <span
          className="uppercase font-medium shrink-0 px-2 py-0.5 rounded"
          style={{
            fontSize:      "var(--text-xs)",
            letterSpacing: "var(--tracking-wide)",
            color:         severityColor,
            border:        `0.5px solid ${severityColor}`,
          }}
        >
          {path.severity}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-medium" style={{ fontSize: "var(--text-md)" }}>
            {path.name}
          </p>
          <p className="text-text-secondary mt-0.5" style={{ fontSize: "var(--text-sm)" }}>
            {path.objective}
          </p>
        </div>

        {sorted.length > 0 && (
          <button
            onClick={() => setIsPresenting(true)}
            className={cn(ctrlBtn, "shrink-0")}
            style={{ fontSize: "var(--text-xs)" }}
            title="Full-screen presentation"
          >
            <Maximize2 className="w-3 h-3" />
            Present
          </button>
        )}

        {showControls && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex rounded overflow-hidden"
              style={{ border: "0.5px solid var(--border-subtle)" }}
            >
              {(["slow", "normal", "fast"] as StorySpeed[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "px-2 py-0.5 transition-colors",
                    speed === s
                      ? "bg-surface-elevated text-text-primary"
                      : "text-text-tertiary hover:text-text-primary"
                  )}
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  {s === "slow" ? "0.5x" : s === "normal" ? "1x" : "2x"}
                </button>
              ))}
            </div>

            {hasStarted && !atEnd && (
              <button
                onClick={handleRestart}
                className={cn(ctrlBtn)}
                style={{ fontSize: "var(--text-xs)" }}
                title="Restart from step 1"
              >
                <RotateCcw className="w-3 h-3" />
                Restart
              </button>
            )}

            {!hasStarted ? (
              <button
                onClick={handlePlay}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded border transition-colors",
                  "border-border-default text-text-primary hover:bg-surface-elevated"
                )}
                style={{ fontSize: "var(--text-xs)" }}
              >
                <Play className="w-3 h-3" />
                Play
              </button>
            ) : isPlaying ? (
              <button onClick={pause} className={cn(ctrlBtn)} style={{ fontSize: "var(--text-xs)" }}>
                <Pause className="w-3 h-3" />
                Pause
              </button>
            ) : atEnd ? (
              <button onClick={handlePlay} className={cn(ctrlBtn)} style={{ fontSize: "var(--text-xs)" }}>
                <RotateCcw className="w-3 h-3" />
                Replay
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded border transition-colors",
                  "border-border-default text-text-primary hover:bg-surface-elevated"
                )}
                style={{ fontSize: "var(--text-xs)" }}
              >
                <Play className="w-3 h-3" />
                Play
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step cards */}
      {sorted.length > 0 && (
        <div className="flex items-start gap-1.5 overflow-x-auto pb-1">
          {sorted.map((step, i) => (
            <div key={step.sequence} className="flex items-start gap-1.5 shrink-0">
              {i > 0 && (
                <div
                  className="mt-4"
                  style={{
                    opacity:    revealedAt(i) ? 1 : 0.2,
                    transition: `opacity var(--duration-normal) var(--easing-default)`,
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
              )}
              <StepCard
                step={step}
                index={i}
                currentStep={currentStep}
                isRevealed={revealedAt(i)}
                hasStarted={hasStarted}
              />
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
