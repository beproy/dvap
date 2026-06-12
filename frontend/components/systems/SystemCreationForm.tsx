"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { createSystem } from "@/lib/api"
import { systemSchema, type SystemFormValues } from "@/lib/systemFormSchema"
import ComponentFieldset from "./ComponentFieldset"
import DataFlowFieldset from "./DataFlowFieldset"

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
      // apiFetch throws "API NNN: <body>" - try to extract FastAPI's detail field
      const jsonMatch = err.message.match(/^API \d+: (.+)$/)
      if (jsonMatch) {
        try {
          const body = JSON.parse(jsonMatch[1])
          if (typeof body.detail === "string") {
            setSubmitError(body.detail)
            return
          }
          if (Array.isArray(body.detail) && body.detail.length > 0) {
            setSubmitError(body.detail[0].msg ?? err.message)
            return
          }
        } catch {
          // body is not JSON - fall through to raw message
        }
      }
      setSubmitError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* System details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">System Details</h2>

        <div className="space-y-1">
          <Label htmlFor="name" className="text-sm text-slate-300">
            Name
          </Label>
          <Input
            {...register("name")}
            id="name"
            placeholder="e.g. Customer Portal"
            className="bg-slate-900 border-slate-700"
          />
          {errors.name && (
            <p className="text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="description" className="text-sm text-slate-300">
            Description
          </Label>
          <Textarea
            {...register("description")}
            id="description"
            placeholder="Describe the system and its purpose (10-500 characters)"
            rows={3}
            className="bg-slate-900 border-slate-700 resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>
      </section>

      <Separator className="bg-slate-800" />

      {/* Components */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Components</h2>
            <p className="text-xs text-slate-500 mt-0.5">Minimum 2 required</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendComponent({ name: "", type: "service", description: "" })
            }
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add component
          </Button>
        </div>

        {errors.components?.root && (
          <p className="text-sm text-red-400">{errors.components.root.message}</p>
        )}
        {typeof errors.components?.message === "string" && (
          <p className="text-sm text-red-400">{errors.components.message}</p>
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

      <Separator className="bg-slate-800" />

      {/* Data flows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Data Flows</h2>
            <p className="text-xs text-slate-500 mt-0.5">Minimum 1 required</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendFlow({
                source: "",
                destination: "",
                data_type: "",
                protocol: "",
                is_encrypted: false,
              })
            }
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add flow
          </Button>
        </div>

        {errors.data_flows?.root && (
          <p className="text-sm text-red-400">{errors.data_flows.root.message}</p>
        )}
        {typeof errors.data_flows?.message === "string" && (
          <p className="text-sm text-red-400">{errors.data_flows.message}</p>
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

      {/* Submit */}
      {submitError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create System"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
