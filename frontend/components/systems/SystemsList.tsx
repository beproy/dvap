"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSystems } from "@/hooks/useSystems"
import SystemCard from "./SystemCard"

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-5 space-y-3">
      <div className="h-4 w-3/4 rounded skeleton-shimmer" />
      <div className="h-3 w-full rounded skeleton-shimmer" />
      <div className="h-3 w-2/3 rounded skeleton-shimmer" />
      <div className="h-3 w-1/3 rounded skeleton-shimmer mt-1" />
    </div>
  )
}

export default function SystemsList() {
  const { data: systems, error, isLoading, mutate } = useSystems()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    const isNetworkError =
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError")
    const errorMessage = isNetworkError
      ? "Cannot reach the backend service. Make sure all containers are running with 'docker compose ps'."
      : error.message
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <AlertCircle
          className="h-8 w-8"
          style={{ color: "var(--severity-critical)" }}
        />
        <div>
          <p className="text-text-primary font-medium" style={{ fontSize: "var(--text-base)" }}>
            Could not load systems
          </p>
          <p
            className="text-text-secondary mt-1 max-w-sm"
            style={{ fontSize: "var(--text-sm)" }}
          >
            {errorMessage}
          </p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!systems || systems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <p className="text-text-secondary" style={{ fontSize: "var(--text-base)" }}>
          No systems yet
        </p>
        <p className="text-text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
          Create your first system to start a threat analysis.
        </p>
        <Link
          href="/systems/new"
          className="mt-2 px-4 py-2 rounded-lg border border-border-subtle bg-surface-raised hover:border-border-default transition-colors text-text-primary"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Create system
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {systems.map((system) => (
        <SystemCard key={system.system_id} system={system} />
      ))}
    </div>
  )
}
