import { cn } from "@/lib/utils"

const AGENT_LABELS: Record<string, string> = {
  stride: "STRIDE",
  maestro: "MAESTRO",
  attack: "ATT&CK",
  attack_tree: "Attack Tree",
  controls: "Controls",
}

interface Props {
  timings: Record<string, number>
  className?: string
}

export default function RunTimings({ timings, className }: Props) {
  const entries = Object.entries(timings)
  if (entries.length === 0) return null

  const total = entries.reduce((sum, [, secs]) => sum + secs, 0)

  return (
    <div className={cn("space-y-1 text-xs min-w-[180px]", className)}>
      {entries.map(([agent, secs]) => (
        <div key={agent} className="flex justify-between gap-6 text-slate-400">
          <span>{AGENT_LABELS[agent] ?? agent}</span>
          <span className="text-slate-500 tabular-nums">{secs.toFixed(1)}s</span>
        </div>
      ))}
      <div className="flex justify-between gap-6 border-t border-slate-800 pt-1 text-slate-300 font-medium">
        <span>Total</span>
        <span className="tabular-nums">{total.toFixed(1)}s</span>
      </div>
    </div>
  )
}
