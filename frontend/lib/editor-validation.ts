interface ValidationNode {
  id: string
  data: { label?: unknown; [key: string]: unknown }
}

interface ValidationEdge {
  source: string
  target: string
}

export interface ValidationInput {
  systemName: string
  systemDescription: string
  nodes: ValidationNode[]
  edges: ValidationEdge[]
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] }

export function validateEditorState(state: ValidationInput): ValidationResult {
  const errors: string[] = []

  const name = state.systemName.trim()
  if (!name) {
    errors.push("System name is required.")
  } else if (name.length > 100) {
    errors.push("System name must be 100 characters or fewer.")
  }

  const desc = state.systemDescription.trim()
  if (!desc) {
    errors.push("System description is required.")
  } else if (desc.length < 10) {
    errors.push("System description must be at least 10 characters.")
  } else if (desc.length > 500) {
    errors.push("System description must be 500 characters or fewer.")
  }

  if (state.nodes.length < 2) {
    errors.push("Add at least 2 components to the canvas.")
  }

  if (state.edges.length < 1) {
    errors.push("Add at least 1 data flow connecting two components.")
  }

  const componentNames = state.nodes.map((n) =>
    typeof n.data.label === "string" ? n.data.label.trim() : ""
  )

  const emptyCount = componentNames.filter((n) => !n).length
  if (emptyCount > 0) {
    errors.push(
      emptyCount === 1
        ? "One component is missing a name."
        : `${emptyCount} components are missing names.`
    )
  }

  const lowerNames = componentNames.filter(Boolean).map((n) => n.toLowerCase())
  if (new Set(lowerNames).size !== lowerNames.length) {
    errors.push("All component names must be unique.")
  }

  const selfFlowCount = state.edges.filter((e) => e.source === e.target).length
  if (selfFlowCount > 0) {
    errors.push("A component cannot connect to itself.")
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true }
}
