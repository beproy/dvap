"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, Loader2, RotateCcw } from "lucide-react"
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

function MetricTile({
  label,
  value,
  valueColor,
}: {
  label: string
  value: number
  valueColor?: string
}) {
  return (
    <div className="rounded-lg bg-surface-raised" style={{ padding: "var(--space-4)" }}>
      <p
        className="text-text-tertiary uppercase font-medium mb-1"
        style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-wide)" }}
      >
        {label}
      </p>
      <p
        className="font-medium"
        style={{
          fontSize: "var(--text-xl)",
          color: valueColor ?? "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  )
}

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
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-text-primary font-medium"
          style={{ fontSize: "var(--text-base)" }}
        >
          {title}
          <span
            className="ml-2 text-text-tertiary font-normal"
            style={{ fontSize: "var(--text-sm)" }}
          >
            ({count})
          </span>
        </h3>
        <CollapsibleTrigger asChild>
          <button
            className="h-7 w-7 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
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
      <div
        className="flex items-center gap-2 text-text-secondary py-8"
        style={{ fontSize: "var(--text-sm)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading findings...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 py-4">
        <div
          className="flex items-center gap-2"
          style={{ fontSize: "var(--text-sm)", color: "var(--severity-critical)" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load findings: {error.message}
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary transition-colors"
          style={{ fontSize: "var(--text-sm)" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    )
  }

  if (!findings) {
    return (
      <div
        className="text-text-tertiary py-4"
        style={{ fontSize: "var(--text-sm)" }}
      >
        No findings data available.
      </div>
    )
  }

  if (findings.status !== "completed") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <RunStatusBadge status={findings.status} />
          <span
            className="text-text-secondary"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Analysis still in progress
          </span>
        </div>
        <AnalysisRunner systemId={systemId} />
      </div>
    )
  }

  const totalThreats = findings.threats.length
  const highImpact = findings.threats.filter((t) => t.impact === "High").length
  const criticalPaths = findings.attack_paths.filter(
    (p) => p.severity === "Critical"
  ).length
  const techniqueCount = [
    ...new Set(findings.technique_mappings.flatMap((m) => m.technique_ids)),
  ].length
  const controls = findings.control_recommendations.length

  const hasThreatErrors = findings.errors.length > 0

  return (
    <div className="space-y-8">
      {/* Metrics row */}
      <div className="grid grid-cols-5 gap-3">
        <MetricTile label="Threats" value={totalThreats} />
        <MetricTile
          label="High Impact"
          value={highImpact}
          valueColor="var(--severity-critical)"
        />
        <MetricTile
          label="Critical Paths"
          value={criticalPaths}
          valueColor="var(--severity-critical)"
        />
        <MetricTile label="Techniques" value={techniqueCount} />
        <MetricTile label="Controls" value={controls} />
      </div>

      {/* Status strip */}
      <div
        className="flex flex-wrap items-center gap-3 py-2"
        style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
      >
        <RunStatusBadge status={findings.status} />
        <span
          className="text-text-tertiary font-mono"
          style={{ fontSize: "var(--text-xs)" }}
        >
          {findings.run_id}
        </span>
        {Object.keys(findings.timings).length > 0 && (
          <RunTimings timings={findings.timings} />
        )}
        {hasThreatErrors && (
          <span
            className="uppercase font-medium"
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--severity-critical)",
            }}
          >
            {findings.errors.length} error
            {findings.errors.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Threats */}
      <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: "var(--space-5)" }}>
        <Section title="Threats" count={findings.threats.length}>
          <ThreatList threats={findings.threats} />
        </Section>
      </div>

      {/* ATT&CK Technique Mappings */}
      <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: "var(--space-5)" }}>
        <Section
          title="ATT&CK Technique Mappings"
          count={findings.technique_mappings.length}
        >
          <TechniqueMappingTable mappings={findings.technique_mappings} />
        </Section>
      </div>

      {/* Attack Paths */}
      <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: "var(--space-5)" }}>
        <Section title="Attack Paths" count={findings.attack_paths.length}>
          <AttackPathsList paths={findings.attack_paths} />
        </Section>
      </div>

      {/* Controls */}
      <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: "var(--space-5)" }}>
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
