import SystemCreationForm from "@/components/systems/SystemCreationForm"

export const metadata = { title: "Create New System - DVAP" }

export default function NewSystemPage() {
  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-text-primary font-medium"
          style={{ fontSize: "var(--text-xl)" }}
        >
          Create New System
        </h1>
        <p
          className="text-text-secondary mt-1"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Define the components and data flows for threat analysis.
        </p>
      </div>
      <SystemCreationForm />
    </div>
  )
}
