"use client"

import { useState } from "react"
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
    { value: "all",     label: "All" },
    { value: "stride",  label: "STRIDE" },
    { value: "maestro", label: "MAESTRO" },
  ]

  const GROUPS: { value: GroupValue; label: string }[] = [
    { value: "component", label: "By Component" },
    { value: "category",  label: "By Category" },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
          {filtered.length} {filtered.length === 1 ? "threat" : "threats"}
        </span>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "px-2.5 py-1 rounded border transition-colors",
                  filter === value
                    ? "bg-surface-elevated border-border-default text-text-primary"
                    : "border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-default"
                )}
                style={{ fontSize: "var(--text-xs)" }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {GROUPS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setGroup(value)}
                className={cn(
                  "px-2.5 py-1 rounded border transition-colors",
                  group === value
                    ? "bg-surface-elevated border-border-default text-text-primary"
                    : "border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-default"
                )}
                style={{ fontSize: "var(--text-xs)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p
          className="text-text-tertiary py-4 text-center"
          style={{ fontSize: "var(--text-sm)" }}
        >
          No threats match the current filter.
        </p>
      ) : (
        <div className="space-y-6">
          {sortedGroupKeys.map((groupKey) => (
            <div key={groupKey}>
              <h4
                className="text-text-tertiary uppercase font-medium mb-2"
                style={{
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-wider)",
                }}
              >
                {groupKey}
                <span className="ml-2 font-normal normal-case">
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
