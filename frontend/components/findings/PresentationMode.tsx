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
      className="fixed inset-0 z-50 bg-surface-base flex flex-col select-none"
    >
      {/* Top progress bar */}
      <div className="h-0.5 bg-surface-raised shrink-0">
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: "var(--accent)",
            transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Path name label and close button */}
      <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
        <p
          className="text-text-tertiary uppercase tracking-widest truncate max-w-[80%]"
          style={{ fontSize: "var(--text-xs)" }}
        >
          {path.name}
        </p>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          aria-label="Close presentation (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main content -- vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p
          className="text-text-tertiary uppercase tracking-widest mb-8"
          style={{ fontSize: "var(--text-xs)" }}
        >
          Step {currentStep + 1} of {total}
        </p>

        <p
          className="mb-6"
          style={{
            fontSize: "var(--text-2xl)",
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
          }}
        >
          {step.technique_id}
        </p>

        <p
          className="text-text-primary font-medium max-w-2xl leading-snug"
          style={{ fontSize: "var(--text-lg)" }}
        >
          {step.description}
        </p>

        <p
          className="text-text-disabled mt-12"
          style={{ fontSize: "var(--text-xs)" }}
        >
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
                  ? "var(--accent)"
                  : i < currentStep
                  ? "var(--border-default)"
                  : "var(--border-subtle)",
              transition: `background-color var(--duration-normal) var(--easing-default)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
