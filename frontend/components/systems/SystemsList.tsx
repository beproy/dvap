"use client"

import Link from "next/link"
import { AlertCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSystems } from "@/hooks/useSystems"
import SystemCard from "./SystemCard"

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-800 p-6 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
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
      ? "Cannot reach the backend service. Make sure all containers are running with 'docker compose ps'. If they are running, check 'docker compose logs backend' for errors."
      : error.message
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div>
          <p className="text-slate-300 font-medium">Could not load systems</p>
          <p className="text-slate-500 text-sm mt-1 max-w-md">{errorMessage}</p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!systems || systems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <p className="text-slate-400 text-lg">No systems yet</p>
        <p className="text-slate-500 text-sm">
          Create your first system to start a threat analysis.
        </p>
        <Button asChild>
          <Link href="/systems/new">
            <Plus className="h-4 w-4 mr-2" />
            Create System
          </Link>
        </Button>
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
