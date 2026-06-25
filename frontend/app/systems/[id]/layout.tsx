import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { getSystemServer } from "@/lib/api.server"
import { ApiError } from "@/lib/errors"
import SystemTabs from "@/components/systems/SystemTabs"
import SystemLoadError from "@/components/systems/SystemLoadError"
import TabContentFade from "@/components/layout/TabContentFade"
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
    if (err instanceof ApiError && err.status === 404) notFound()
    fetchError = err instanceof Error ? err.message : "Failed to load system"
  }

  if (!system && !fetchError) notFound()
  if (fetchError) return <SystemLoadError message={fetchError} />
  if (!system) notFound()

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-text-primary font-medium"
          style={{ fontSize: "var(--text-xl)" }}
        >
          {system.name}
        </h1>
        {system.description && (
          <p
            className="text-text-secondary mt-1 max-w-2xl"
            style={{ fontSize: "var(--text-sm)" }}
          >
            {system.description}
          </p>
        )}
      </div>
      <SystemTabs systemId={params.id} />
      <div className="mt-6">
        <TabContentFade>{children}</TabContentFade>
      </div>
    </div>
  )
}
