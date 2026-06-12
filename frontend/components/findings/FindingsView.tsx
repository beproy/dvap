"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useAnalysisFindings } from "@/hooks/useAnalysisFindings"
import RunStatusBadge from "@/components/runs/RunStatusBadge"
import RunTimings from "@/components/runs/RunTimings"
import AnalysisRunner from "@/components/runs/AnalysisRunner"
import ThreatList from "./ThreatList"
import TechniqueMappingTable from "./TechniqueMappingTable"
import AttackPathsList from "./AttackPathsList"
import ControlsList from "./ControlsList"

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-100">
          {title}
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({count})
          </span>
        </h3>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

interface Props {
  runId: string
  systemId: string
}

export default function FindingsView({ runId, systemId }: Props) {
  const { data: findings, error, isLoading, mutate } = useAnalysisFindings(runId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading findings...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 py-4">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load findings: {error.message}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  if (!findings) {
    return (
      <div className="text-sm text-slate-500 py-4">
        No findings data available.
      </div>
    )
  }

  // Run not yet complete: show runner so the user can see progress or start one.
  if (findings.status !== "completed") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <RunStatusBadge status={findings.status} />
          <span className="text-sm text-slate-400">Analysis still in progress</span>
        </div>
        <AnalysisRunner systemId={systemId} />
      </div>
    )
  }

  const hasThreatErrors = findings.errors.length > 0

  return (
    <div className="space-y-8">
      {/* Status summary card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <RunStatusBadge status={findings.status} />
          <span className="text-xs text-slate-500 font-mono">{findings.run_id}</span>
        </div>
        {Object.keys(findings.timings).length > 0 && (
          <RunTimings timings={findings.timings} />
        )}
        {hasThreatErrors && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Errors
            </p>
            {findings.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-400">{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Threats */}
      <div className="border-t border-slate-800 pt-6">
        <Section title="Threats" count={findings.threats.length}>
          <ThreatList threats={findings.threats} />
        </Section>
      </div>

      {/* ATT&CK Technique Mappings */}
      <div className="border-t border-slate-800 pt-6">
        <Section
          title="ATT&CK Technique Mappings"
          count={findings.technique_mappings.length}
        >
          <TechniqueMappingTable mappings={findings.technique_mappings} />
        </Section>
      </div>

      {/* Attack Paths */}
      <div className="border-t border-slate-800 pt-6">
        <Section title="Attack Paths" count={findings.attack_paths.length}>
          <AttackPathsList paths={findings.attack_paths} />
        </Section>
      </div>

      {/* Controls */}
      <div className="border-t border-slate-800 pt-6">
        <Section
          title="Control Recommendations"
          count={findings.control_recommendations.length}
        >
          <ControlsList controls={findings.control_recommendations} />
        </Section>
      </div>
    </div>
  )
}
