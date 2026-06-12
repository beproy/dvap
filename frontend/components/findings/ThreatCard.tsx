"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Threat } from "@/lib/types"

const LEVEL_CLASSES: Record<string, string> = {
  Low: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  Medium: "bg-orange-900/40 text-orange-300 border-orange-800",
  High: "bg-red-900/40 text-red-300 border-red-800",
}

const AGENT_LABEL: Record<string, string> = {
  stride: "STRIDE",
  maestro: "MAESTRO",
}

interface Props {
  threat: Threat
}

export default function ThreatCard({ threat }: Props) {
  const [expanded, setExpanded] = useState(false)
  const hasExtra = !!(threat.attack_vector || threat.abuse_case)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-100 text-sm">
              {threat.title}
            </span>
            {threat.source_agent && (
              <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                {AGENT_LABEL[threat.source_agent] ?? threat.source_agent}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge className="bg-slate-700 text-slate-400 border-slate-600">
              {threat.category}
            </Badge>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 font-medium",
                LEVEL_CLASSES[threat.likelihood] ?? LEVEL_CLASSES["Medium"]
              )}
            >
              L: {threat.likelihood}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 font-medium",
                LEVEL_CLASSES[threat.impact] ?? LEVEL_CLASSES["Medium"]
              )}
            >
              I: {threat.impact}
            </span>
            <span className="text-slate-500">{threat.component_name}</span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-500 shrink-0 mt-0.5 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            {threat.description}
          </p>
          {threat.attack_vector && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Attack Vector
              </p>
              <p className="text-sm text-slate-400">{threat.attack_vector}</p>
            </div>
          )}
          {threat.abuse_case && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Abuse Case
              </p>
              <p className="text-sm text-slate-400">{threat.abuse_case}</p>
            </div>
          )}
          {!hasExtra && (
            <p className="text-xs text-slate-600 italic">No additional details.</p>
          )}
        </div>
      )}
    </div>
  )
}
