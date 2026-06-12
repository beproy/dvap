"use client"

import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TABS = [
  { value: "architecture", label: "Architecture" },
  { value: "findings", label: "Findings" },
  { value: "runs", label: "Runs" },
] as const

export default function SystemTabs({ systemId }: { systemId: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const lastSegment = pathname.split("/").pop() ?? ""
  const activeTab =
    TABS.find((t) => t.value === lastSegment)?.value ?? "architecture"

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.push(`/systems/${systemId}/${value}`)}
    >
      <TabsList className="bg-slate-900 border border-slate-800 h-10">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
