import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { getSystemServer } from "@/lib/api.server"
import { ApiError } from "@/lib/errors"
import SystemTabs from "@/components/systems/SystemTabs"
import SystemLoadError from "@/components/systems/SystemLoadError"
import type { SystemOut } from "@/lib/types"

export default async function SystemLayout({
  params,
  children,
}: {
  params: { id: string }
  children: ReactNode
}) {
  let system: SystemOut | null = null
  let fetchError: string | null = null

  try {
    system = await getSystemServer(params.id)
  } catch (err) {
    // 404 means the system ID is invalid - show the not-found page.
    // Any other error (5xx, network failure) renders an inline error card
    // so the user can retry without a raw crash page.
    if (err instanceof ApiError && err.status === 404) notFound()
    fetchError = err instanceof Error ? err.message : "Failed to load system"
  }

  if (!system && !fetchError) notFound()

  if (fetchError) {
    return <SystemLoadError message={fetchError} />
  }

  // At this point system is guaranteed non-null: error path returned above,
  // null+no-error path called notFound() above.
  if (!system) notFound()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">{system.name}</h1>
        {system.description && (
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">{system.description}</p>
        )}
      </div>
      <SystemTabs systemId={params.id} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
