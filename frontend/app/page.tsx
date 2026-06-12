import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import SystemsList from "@/components/systems/SystemsList"

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Systems</h1>
        <Button asChild>
          <Link href="/systems/new">
            <Plus className="h-4 w-4 mr-2" />
            New System
          </Link>
        </Button>
      </div>
      <SystemsList />
    </div>
  )
}
