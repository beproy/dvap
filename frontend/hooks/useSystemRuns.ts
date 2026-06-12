import useSWR from "swr"
import { listRuns } from "@/lib/api"
import type { AnalysisRunSummary } from "@/lib/types"

export function useSystemRuns(systemId: string) {
  return useSWR<AnalysisRunSummary[], Error>(
    `/api/analyses?system_id=${systemId}`,
    () => listRuns(systemId),
    {
      refreshInterval: (latestData) => {
        if (!latestData) return 5000
        const hasActive = latestData.some(
          (r) => r.status === "pending" || r.status === "running"
        )
        return hasActive ? 3000 : 0
      },
    }
  )
}
