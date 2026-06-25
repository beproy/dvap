"use client"

import { Control, Controller, UseFormRegister, FieldErrors, useWatch } from "react-hook-form"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SystemFormValues } from "@/lib/systemFormSchema"

const FIELD_CLS =
  "bg-surface-base border-border-subtle text-text-primary placeholder:text-text-disabled"

const LABEL_STYLE = {
  fontSize: "var(--text-xs)",
  letterSpacing: "var(--tracking-wide)",
}

interface Props {
  index: number
  control: Control<SystemFormValues>
  register: UseFormRegister<SystemFormValues>
  errors: FieldErrors<SystemFormValues>
  onRemove: () => void
  canRemove: boolean
}

export default function DataFlowFieldset({
  index,
  control,
  register,
  errors,
  onRemove,
  canRemove,
}: Props) {
  const flowErrors = errors.data_flows?.[index]

  const components = useWatch({ control, name: "components" })
  const componentNames = components.map((c) => c.name).filter(Boolean)

  const currentSource = useWatch({ control, name: `data_flows.${index}.source` })
  const destinationOptions = componentNames.filter((n) => n !== currentSource)

  return (
    <div
      className="rounded-lg bg-surface-raised p-4 space-y-3"
      style={{ border: "0.5px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-text-secondary font-medium"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Flow {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-text-tertiary hover:text-severity-critical transition-colors p-1 rounded"
            aria-label="Remove data flow"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            className="text-text-secondary uppercase font-medium"
            style={LABEL_STYLE}
          >
            Source
          </label>
          <Controller
            name={`data_flows.${index}.source`}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={componentNames.length === 0}
              >
                <SelectTrigger
                  className={`${FIELD_CLS} focus:ring-0 focus:ring-offset-0`}
                >
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {componentNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {flowErrors?.source && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {flowErrors.source.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            className="text-text-secondary uppercase font-medium"
            style={LABEL_STYLE}
          >
            Destination
          </label>
          <Controller
            name={`data_flows.${index}.destination`}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={destinationOptions.length === 0}
              >
                <SelectTrigger
                  className={`${FIELD_CLS} focus:ring-0 focus:ring-offset-0`}
                >
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {flowErrors?.destination && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {flowErrors.destination.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor={`data_flows.${index}.data_type`}
            className="text-text-secondary uppercase font-medium"
            style={LABEL_STYLE}
          >
            Data Type
          </label>
          <Input
            {...register(`data_flows.${index}.data_type`)}
            id={`data_flows.${index}.data_type`}
            placeholder="e.g. JSON over HTTPS"
            className={FIELD_CLS}
          />
          {flowErrors?.data_type && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {flowErrors.data_type.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`data_flows.${index}.protocol`}
            className="text-text-secondary uppercase font-medium"
            style={LABEL_STYLE}
          >
            Protocol
          </label>
          <Input
            {...register(`data_flows.${index}.protocol`)}
            id={`data_flows.${index}.protocol`}
            placeholder="e.g. HTTPS"
            className={FIELD_CLS}
          />
          {flowErrors?.protocol && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {flowErrors.protocol.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register(`data_flows.${index}.is_encrypted`)}
          id={`data_flows.${index}.is_encrypted`}
          className="h-4 w-4 rounded border-border-subtle bg-surface-base cursor-pointer"
          style={{ accentColor: "var(--accent)" }}
        />
        <label
          htmlFor={`data_flows.${index}.is_encrypted`}
          className="text-text-secondary cursor-pointer"
          style={{ fontSize: "var(--text-xs)" }}
        >
          Encrypted in transit
        </label>
      </div>
    </div>
  )
}
