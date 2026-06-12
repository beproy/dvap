import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ControlRecommendation } from "@/lib/types"

const PRIORITY_CLASSES: Record<string, string> = {
  "Quick win": "bg-green-900/40 text-green-300 border-green-800",
  Standard: "bg-blue-900/40 text-blue-300 border-blue-800",
  Strategic: "bg-purple-900/40 text-purple-300 border-purple-800",
}

interface Props {
  control: ControlRecommendation
}

export default function ControlCard({ control }: Props) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <Badge className="bg-slate-700 text-slate-300 border-slate-600 font-mono text-xs shrink-0">
          {control.control_id}
        </Badge>
        <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-xs shrink-0">
          {control.framework}
        </Badge>
        <Badge
          className={cn(
            "text-xs shrink-0",
            PRIORITY_CLASSES[control.priority] ?? PRIORITY_CLASSES["Standard"]
          )}
        >
          {control.priority}
        </Badge>
      </div>

      <p className="font-medium text-slate-100 text-sm">{control.name}</p>

      {control.implementation_notes && (
        <p className="text-sm text-slate-400 leading-relaxed">
          {control.implementation_notes}
        </p>
      )}

      {control.addresses_threats.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Addresses threats
          </p>
          <ul className="space-y-0.5">
            {control.addresses_threats.map((t, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-1">
                <span className="text-slate-600">-</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {control.addresses_techniques.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Addresses techniques
          </p>
          <div className="flex flex-wrap gap-1">
            {control.addresses_techniques.map((id) => (
              <a
                key={id}
                href={
                  id.includes(".")
                    ? `https://attack.mitre.org/techniques/${id.split(".")[0]}/${id.split(".")[1]}/`
                    : `https://attack.mitre.org/techniques/${id}/`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge className="bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600 text-xs cursor-pointer">
                  {id}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
