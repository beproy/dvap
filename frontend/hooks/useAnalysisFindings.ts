import useSWR from "swr"
import { getAnalysisFindings } from "@/lib/api"
import type { AnalysisFindings } from "@/lib/types"

export function useAnalysisFindings(runId: string | null) {
  return useSWR<AnalysisFindings, Error>(
    runId ? `/api/analyses/${runId}/findings` : null,
    runId ? () => getAnalysisFindings(runId) : null
  )
}
