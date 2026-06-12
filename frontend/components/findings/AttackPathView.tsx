import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AttackPath } from "@/lib/types"

function mitreUrl(id: string): string {
  if (id.includes(".")) {
    const dotIndex = id.indexOf(".")
    return `https://attack.mitre.org/techniques/${id.slice(0, dotIndex)}/${id.slice(dotIndex + 1)}/`
  }
  return `https://attack.mitre.org/techniques/${id}/`
}

const SEVERITY_CLASSES: Record<string, string> = {
  Low: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  Medium: "bg-orange-900/40 text-orange-300 border-orange-800",
  High: "bg-red-900/40 text-red-300 border-red-800",
  Critical: "bg-red-950/80 text-red-200 border-red-500",
}

interface Props {
  path: AttackPath
}

export default function AttackPathView({ path }: Props) {
  const sorted = [...path.steps].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4 space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <Badge
          className={cn(
            "shrink-0",
            SEVERITY_CLASSES[path.severity] ?? SEVERITY_CLASSES["Medium"]
          )}
        >
          {path.severity}
        </Badge>
        <div>
          <p className="font-medium text-slate-100 text-sm">{path.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{path.objective}</p>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="flex items-start gap-1 overflow-x-auto pb-1">
          {sorted.map((step, i) => (
            <div key={step.sequence} className="flex items-start gap-1 shrink-0">
              {i > 0 && (
                <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 mt-3" />
              )}
              <div className="rounded border border-slate-700 bg-slate-900 p-2.5 w-[150px]">
                <a
                  href={mitreUrl(step.technique_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Badge className="bg-blue-900/40 text-blue-300 border-blue-800 hover:bg-blue-800/60 text-xs mb-1.5">
                    {step.technique_id}
                  </Badge>
                </a>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
