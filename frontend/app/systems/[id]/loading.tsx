import { Skeleton } from "@/components/ui/skeleton"

export default function SystemLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56 bg-slate-800" />
        <Skeleton className="h-4 w-96 bg-slate-800" />
      </div>
      <Skeleton className="h-10 w-72 bg-slate-800" />
      <div className="mt-6">
        <Skeleton className="h-[420px] w-full rounded-lg bg-slate-800" />
      </div>
    </div>
  )
}
