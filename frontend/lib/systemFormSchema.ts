import { z } from "zod"

export const COMPONENT_TYPES = [
  "web_app",
  "service",
  "database",
  "gateway",
  "queue",
  "storage",
  "auth",
  "external",
  "other",
] as const

export const COMPONENT_TYPE_LABELS: Record<(typeof COMPONENT_TYPES)[number], string> = {
  web_app: "Web App",
  service: "Service",
  database: "Database",
  gateway: "Gateway",
  queue: "Queue",
  storage: "Storage",
  auth: "Auth",
  external: "External",
  other: "Other",
}

const componentSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Component name must be 80 characters or less"),
  type: z.enum(COMPONENT_TYPES),
  description: z.string().min(1, "Description is required"),
})

const dataFlowSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  data_type: z.string().min(1, "Data type is required").max(80, "Data type must be 80 characters or less"),
  protocol: z.string().min(1, "Protocol is required").max(80, "Protocol must be 80 characters or less"),
  is_encrypted: z.boolean(),
})

export const systemSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be 500 characters or less"),
    components: z.array(componentSchema).min(2, "At least 2 components are required"),
    data_flows: z.array(dataFlowSchema).min(1, "At least 1 data flow is required"),
  })
  .superRefine((data, ctx) => {
    // Duplicate component names
    const seenNames = new Set<string>()
    data.components.forEach((comp, i) => {
      if (comp.name && seenNames.has(comp.name)) {
        ctx.addIssue({
          code: "custom",
          message: "Component names must be unique.",
          path: ["components", i, "name"],
        })
      }
      if (comp.name) seenNames.add(comp.name)
    })

    // Flow source/destination must reference existing component names; no self-flows
    const validNames = new Set(data.components.map((c) => c.name).filter(Boolean))
    data.data_flows.forEach((flow, i) => {
      if (flow.source && !validNames.has(flow.source)) {
        ctx.addIssue({
          code: "custom",
          message: "Source/destination must be an existing component.",
          path: ["data_flows", i, "source"],
        })
      }
      if (flow.destination && !validNames.has(flow.destination)) {
        ctx.addIssue({
          code: "custom",
          message: "Source/destination must be an existing component.",
          path: ["data_flows", i, "destination"],
        })
      }
      if (flow.source && flow.destination && flow.source === flow.destination) {
        ctx.addIssue({
          code: "custom",
          message: "A data flow cannot point from a component to itself.",
          path: ["data_flows", i, "destination"],
        })
      }
    })
  })

export type SystemFormValues = z.infer<typeof systemSchema>
