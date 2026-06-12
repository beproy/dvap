import useSWR from "swr"
import { getSystem } from "@/lib/api"
import type { SystemOut } from "@/lib/types"

export function useSystem(systemId: string | null) {
  return useSWR<SystemOut, Error>(
    systemId ? `/api/systems/${systemId}` : null,
    systemId ? () => getSystem(systemId) : null
  )
}
