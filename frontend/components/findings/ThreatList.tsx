"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Threat } from "@/lib/types"
import ThreatCard from "./ThreatCard"

type FilterValue = "all" | "stride" | "maestro"
type GroupValue = "component" | "category"

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

interface Props {
  threats: Threat[]
}

export default function ThreatList({ threats }: Props) {
  const [filter, setFilter] = useState<FilterValue>("all")
  const [group, setGroup] = useState<GroupValue>("component")

  const filtered = threats.filter((t) => {
    if (filter === "all") return true
    return t.source_agent === filter
  })

  const groups =
    group === "component"
      ? groupBy(filtered, (t) => t.component_name)
      : groupBy(filtered, (t) => t.category)

  const sortedGroupKeys = Object.keys(groups).sort()

  const FILTERS: { value: FilterValue; label: string }[] = [
    { value: "all", label: "All" },
    { value: "stride", label: "STRIDE" },
    { value: "maestro", label: "MAESTRO" },
  ]

  const GROUPS: { value: GroupValue; label: string }[] = [
    { value: "component", label: "By Component" },
    { value: "category", label: "By Category" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? "threat" : "threats"}
        </span>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setFilter(value)}
                className={cn(
                  "h-7 border-slate-700 text-xs",
                  filter === value
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {GROUPS.map(({ value, label }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setGroup(value)}
                className={cn(
                  "h-7 border-slate-700 text-xs",
                  group === value
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          No threats match the current filter.
        </p>
      ) : (
        <div className="space-y-6">
          {sortedGroupKeys.map((groupKey) => (
            <div key={groupKey}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {groupKey}
                <span className="ml-2 text-slate-600 font-normal normal-case">
                  ({groups[groupKey].length})
                </span>
              </h4>
              <div className="space-y-2">
                {groups[groupKey].map((threat, i) => (
                  <ThreatCard key={threat.threat_id ?? `${groupKey}-${i}`} threat={threat} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
