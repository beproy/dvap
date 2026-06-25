import { useState, useEffect, useCallback } from "react"

export type StorySpeed = "slow" | "normal" | "fast"

const SPEED_MS: Record<StorySpeed, number> = {
  slow: 800,
  normal: 400,
  fast: 200,
}

export interface StoryModePlayer {
  currentStep: number
  isPlaying: boolean
  speed: StorySpeed
  play: () => void
  pause: () => void
  restart: () => void
  next: () => void
  prev: () => void
  setSpeed: (speed: StorySpeed) => void
}

export function useStoryModePlayer(steps: unknown[]): StoryModePlayer {
  const last = steps.length - 1

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeedState] = useState<StorySpeed>("normal")

  // Advance one step per interval while playing; stop at the last step.
  useEffect(() => {
    if (!isPlaying) return
    if (currentStep >= last) {
      setIsPlaying(false)
      return
    }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), SPEED_MS[speed])
    return () => clearTimeout(timer)
  }, [isPlaying, currentStep, speed, last])

  const play = useCallback(() => {
    setCurrentStep((s) => {
      // If already at end, restart from beginning before playing.
      return s >= last && last >= 0 ? 0 : s
    })
    setIsPlaying(true)
  }, [last])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const restart = useCallback(() => {
    setIsPlaying(false)
    setCurrentStep(0)
  }, [])

  const next = useCallback(() => {
    setIsPlaying(false)
    setCurrentStep((s) => Math.min(s + 1, Math.max(last, 0)))
  }, [last])

  const prev = useCallback(() => {
    setIsPlaying(false)
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])

  const setSpeed = useCallback((s: StorySpeed) => {
    setSpeedState(s)
  }, [])

  return { currentStep, isPlaying, speed, play, pause, restart, next, prev, setSpeed }
}
