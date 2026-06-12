"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <div>
        <p className="text-slate-100 text-lg font-semibold">Something went wrong</p>
        <p className="text-slate-400 text-sm mt-1">
          We couldn't load this system. The backend service may be unavailable.
        </p>
      </div>
      {error.message && (
        <pre className="mt-1 max-w-md rounded bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-500 text-left overflow-auto">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3 mt-2">
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="outline"
          asChild
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Link href="/">Back to systems</Link>
        </Button>
      </div>
    </div>
  )
}
