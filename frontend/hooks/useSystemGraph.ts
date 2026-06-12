import useSWR from "swr"
import { getSystemGraph } from "@/lib/api"
import type { SystemGraph } from "@/lib/types"

export function useSystemGraph(systemId: string | null) {
  return useSWR<SystemGraph, Error>(
    systemId ? `/api/systems/${systemId}/graph` : null,
    systemId ? () => getSystemGraph(systemId) : null
  )
}
