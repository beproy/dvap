"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SystemError({
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
        <p className="text-slate-300 font-medium">Failed to load system</p>
        <p className="text-slate-500 text-sm mt-1">
          The system may be unavailable. Check that the backend is running.
        </p>
      </div>
      <div className="flex gap-3">
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
