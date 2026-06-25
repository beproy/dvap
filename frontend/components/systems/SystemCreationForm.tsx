"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createSystem } from "@/lib/api"
import { systemSchema, type SystemFormValues } from "@/lib/systemFormSchema"
import ComponentFieldset from "./ComponentFieldset"
import DataFlowFieldset from "./DataFlowFieldset"

const INPUT_CLS =
  "bg-surface-base border-border-subtle text-text-primary placeholder:text-text-disabled"

const DEFAULT_VALUES: SystemFormValues = {
  name: "",
  description: "",
  components: [
    { name: "", type: "service", description: "" },
    { name: "", type: "service", description: "" },
  ],
  data_flows: [
    { source: "", destination: "", data_type: "", protocol: "", is_encrypted: false },
  ],
}

export default function SystemCreationForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const {
    fields: componentFields,
    append: appendComponent,
    remove: removeComponent,
  } = useFieldArray({ control, name: "components" })

  const {
    fields: flowFields,
    append: appendFlow,
    remove: removeFlow,
  } = useFieldArray({ control, name: "data_flows" })

  async function onSubmit(values: SystemFormValues) {
    setSubmitError(null)
    try {
      const result = await createSystem(values)
      router.push(`/systems/${result.system_id}`)
    } catch (err) {
      if (!(err instanceof Error)) {
        setSubmitError("Failed to create system")
        return
      }
      const jsonMatch = err.message.match(/^API \d+: (.+)$/)
      if (jsonMatch) {
        try {
          const body = JSON.parse(jsonMatch[1])
          if (typeof body.detail === "string") { setSubmitError(body.detail); return }
          if (Array.isArray(body.detail) && body.detail.length > 0) {
            setSubmitError(body.detail[0].msg ?? err.message)
            return
          }
        } catch { /* body is not JSON */ }
      }
      setSubmitError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* System details */}
      <section className="space-y-4">
        <h2
          className="text-text-primary font-medium"
          style={{ fontSize: "var(--text-lg)" }}
        >
          System Details
        </h2>

        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-text-secondary uppercase font-medium"
            style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-wide)" }}
          >
            Name
          </label>
          <Input
            {...register("name")}
            id="name"
            placeholder="e.g. Customer Portal"
            className={INPUT_CLS}
          />
          {errors.name && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="description"
            className="text-text-secondary uppercase font-medium"
            style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-wide)" }}
          >
            Description
          </label>
          <Textarea
            {...register("description")}
            id="description"
            placeholder="Describe the system and its purpose (10-500 characters)"
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
          {errors.description && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {errors.description.message}
            </p>
          )}
        </div>
      </section>

      <div style={{ borderBottom: "0.5px solid var(--border-subtle)" }} />

      {/* Components */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-text-primary font-medium"
              style={{ fontSize: "var(--text-lg)" }}
            >
              Components
            </h2>
            <p
              className="text-text-tertiary mt-0.5"
              style={{ fontSize: "var(--text-xs)" }}
            >
              Minimum 2 required
            </p>
          </div>
          <button
            type="button"
            onClick={() => appendComponent({ name: "", type: "service", description: "" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary transition-colors"
            style={{ fontSize: "var(--text-sm)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add component
          </button>
        </div>

        {errors.components?.root && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
            {errors.components.root.message}
          </p>
        )}
        {typeof errors.components?.message === "string" && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
            {errors.components.message}
          </p>
        )}

        <div className="space-y-3">
          {componentFields.map((field, index) => (
            <ComponentFieldset
              key={field.id}
              index={index}
              control={control}
              register={register}
              errors={errors}
              onRemove={() => removeComponent(index)}
              canRemove={componentFields.length > 2}
            />
          ))}
        </div>
      </section>

      <div style={{ borderBottom: "0.5px solid var(--border-subtle)" }} />

      {/* Data flows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-text-primary font-medium"
              style={{ fontSize: "var(--text-lg)" }}
            >
              Data Flows
            </h2>
            <p
              className="text-text-tertiary mt-0.5"
              style={{ fontSize: "var(--text-xs)" }}
            >
              Minimum 1 required
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              appendFlow({ source: "", destination: "", data_type: "", protocol: "", is_encrypted: false })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary transition-colors"
            style={{ fontSize: "var(--text-sm)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add flow
          </button>
        </div>

        {errors.data_flows?.root && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
            {errors.data_flows.root.message}
          </p>
        )}
        {typeof errors.data_flows?.message === "string" && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
            {errors.data_flows.message}
          </p>
        )}

        <div className="space-y-3">
          {flowFields.map((field, index) => (
            <DataFlowFieldset
              key={field.id}
              index={index}
              control={control}
              register={register}
              errors={errors}
              onRemove={() => removeFlow(index)}
              canRemove={flowFields.length > 1}
            />
          ))}
        </div>
      </section>

      {/* Submit error */}
      {submitError && (
        <div
          className="flex items-start gap-2 rounded-lg bg-surface-raised p-3"
          style={{
            borderTop:    "0.5px solid var(--border-subtle)",
            borderRight:  "0.5px solid var(--border-subtle)",
            borderBottom: "0.5px solid var(--border-subtle)",
            borderLeft:   "2px solid var(--severity-critical)",
          }}
        >
          <AlertCircle
            className="h-4 w-4 mt-0.5 shrink-0"
            style={{ color: "var(--severity-critical)" }}
          />
          <span
            className="text-text-secondary"
            style={{ fontSize: "var(--text-sm)" }}
          >
            {submitError}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-bright text-surface-base font-medium transition-colors disabled:opacity-50"
          style={{ fontSize: "var(--text-sm)" }}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create System"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg border border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary transition-colors disabled:opacity-50"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
