"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { value: "architecture", label: "Architecture" },
  { value: "findings",     label: "Findings" },
  { value: "runs",         label: "Runs" },
] as const

export default function SystemTabs({ systemId }: { systemId: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const lastSegment = pathname.split("/").pop() ?? ""
  const activeTab = TABS.find((t) => t.value === lastSegment)?.value ?? "architecture"

  return (
    <div className="flex border-b border-border-subtle">
      {TABS.map((tab) => {
        const isActive = tab.value === activeTab
        return (
          <button
            key={tab.value}
            onClick={() => router.push(`/systems/${systemId}/${tab.value}`)}
            style={{
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-wide)",
            }}
            className={cn(
              "px-4 py-2.5 uppercase font-medium transition-colors -mb-px border-b-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              isActive
                ? "text-text-primary border-accent"
                : "text-text-secondary border-transparent hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
