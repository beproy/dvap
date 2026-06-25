import Link from "next/link"
import SystemsList from "@/components/systems/SystemsList"

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Systems</h1>
      </div>

      <div className="flex gap-3 mb-8">
        <Link
          href="/systems/new"
          className="flex flex-col gap-1 px-4 py-3 border border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm font-medium text-slate-200">Quick form</span>
          <span className="text-xs text-slate-500">
            Describe components and flows in a structured form.
          </span>
        </Link>
        <Link
          href="/systems/new/visual"
          className="flex flex-col gap-1 px-4 py-3 border border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm font-medium text-slate-200">Visual editor</span>
          <span className="text-xs text-slate-500">
            Drag, connect, and edit a diagram.
          </span>
        </Link>
      </div>

      <SystemsList />
    </div>
  )
}
