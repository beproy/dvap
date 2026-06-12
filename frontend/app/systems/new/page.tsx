import SystemCreationForm from "@/components/systems/SystemCreationForm"

export const metadata = { title: "Create New System - DVAP" }

export default function NewSystemPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Create New System</h1>
        <p className="text-slate-400 text-sm mt-1">
          Define the components and data flows for threat analysis.
        </p>
      </div>
      <SystemCreationForm />
    </div>
  )
}
