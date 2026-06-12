import ArchitectureGraph from "@/components/graph/ArchitectureGraph"

export default function ArchitecturePage({ params }: { params: { id: string } }) {
  return (
    <div className="h-[calc(100vh-280px)] min-h-[420px] rounded-lg overflow-hidden border border-slate-800">
      <ArchitectureGraph systemId={params.id} />
    </div>
  )
}
