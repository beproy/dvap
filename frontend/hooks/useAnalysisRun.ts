import useSWR from "swr"
import { getAnalysisRun } from "@/lib/api"
import type { AnalysisRun } from "@/lib/types"

export function useAnalysisRun(runId: string | null) {
  return useSWR<AnalysisRun, Error>(
    runId ? `/api/analyses/${runId}` : null,
    runId ? () => getAnalysisRun(runId) : null,
    {
      refreshInterval: (latestData) => {
        if (!latestData) return 3000
        return latestData.status === "pending" || latestData.status === "running"
          ? 3000
          : 0
      },
      refreshWhenHidden: true,
    }
  )
}
