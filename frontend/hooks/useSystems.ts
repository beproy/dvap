import useSWR from "swr"
import { listSystems } from "@/lib/api"
import type { SystemSummary } from "@/lib/types"

export function useSystems() {
  return useSWR<SystemSummary[], Error>(
    "/api/systems",
    () => listSystems()
  )
}
