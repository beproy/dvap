"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"
import type { AttackPath } from "@/lib/types"

interface Props {
  path: AttackPath
  onClose: () => void
}

export default function PresentationMode({ path, onClose }: Props) {
  const sorted = [...path.steps].sort((a, b) => a.sequence - b.sequence)
  const total = sorted.length

  const [currentStep, setCurrentStep] = useState(0)
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false)

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, total - 1))
  }, [total])

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])

  // Keyboard controls: Space/ArrowRight advance, ArrowLeft goes back, Esc closes.
  // Any key interaction pauses auto-advance for the session.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault()
        setAutoAdvancePaused(true)
        goNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        setAutoAdvancePaused(true)
        goPrev()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, goNext, goPrev])

  // Auto-advance every 4 seconds; cancelled permanently on first keyboard interaction.
  useEffect(() => {
    if (autoAdvancePaused || currentStep >= total - 1) return
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 4000)
    return () => clearTimeout(timer)
  }, [currentStep, autoAdvancePaused, total])

  if (total === 0) return null
  const step = sorted[currentStep]
  if (!step) return null

  const progressPct = ((currentStep + 1) / total) * 100

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Presentation: ${path.name}`}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none"
    >
      {/* Top progress bar */}
      <div className="h-0.5 bg-slate-800 shrink-0">
        <div
          className="h-full bg-cyan-500"
          style={{
            width: `${progressPct}%`,
            transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Path name label and close button */}
      <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
        <p className="text-xs text-slate-600 uppercase tracking-widest truncate max-w-[80%]">
          {path.name}
        </p>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close presentation (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main content -- vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-8">
          Step {currentStep + 1} of {total}
        </p>

        <p
          className="text-4xl text-cyan-400 mb-6"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {step.technique_id}
        </p>

        <p className="text-xl font-semibold text-slate-100 max-w-2xl leading-snug">
          {step.description}
        </p>

        <p className="text-xs text-slate-700 mt-12">
          Space / Arrow keys to navigate &nbsp;&middot;&nbsp; Esc to close
        </p>
      </div>

      {/* Dot navigation */}
      <div className="shrink-0 pb-10 flex items-center justify-center gap-2.5">
        {sorted.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setAutoAdvancePaused(true)
              setCurrentStep(i)
            }}
            aria-label={`Go to step ${i + 1}`}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                i === currentStep
                  ? "rgb(34 211 238)"
                  : i < currentStep
                  ? "rgb(71 85 105)"
                  : "rgb(30 41 59)",
              transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ))}
      </div>
    </div>
  )
}
