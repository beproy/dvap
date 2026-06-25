"use client"

import { Control, Controller, UseFormRegister, FieldErrors } from "react-hook-form"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  COMPONENT_TYPE_LABELS,
  COMPONENT_TYPES,
  type SystemFormValues,
} from "@/lib/systemFormSchema"

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

export default function ComponentFieldset({
  index,
  control,
  register,
  errors,
  onRemove,
  canRemove,
}: Props) {
  const componentErrors = errors.components?.[index]

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
          Component {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-text-tertiary hover:text-severity-critical transition-colors p-1 rounded"
            aria-label="Remove component"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor={`components.${index}.name`}
            className="text-text-secondary uppercase font-medium"
            style={LABEL_STYLE}
          >
            Name
          </label>
          <Input
            {...register(`components.${index}.name`)}
            id={`components.${index}.name`}
            placeholder="e.g. API Gateway"
            className={FIELD_CLS}
          />
          {componentErrors?.name && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {componentErrors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            className="text-text-secondary uppercase font-medium"
            style={LABEL_STYLE}
          >
            Type
          </label>
          <Controller
            name={`components.${index}.type`}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className={`${FIELD_CLS} focus:ring-0 focus:ring-offset-0`}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPONENT_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {COMPONENT_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {componentErrors?.type && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
              {componentErrors.type.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`components.${index}.description`}
          className="text-text-secondary uppercase font-medium"
          style={LABEL_STYLE}
        >
          Description
        </label>
        <Textarea
          {...register(`components.${index}.description`)}
          id={`components.${index}.description`}
          placeholder="What does this component do?"
          rows={2}
          className={`${FIELD_CLS} resize-none`}
        />
        {componentErrors?.description && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--severity-critical)" }}>
            {componentErrors.description.message}
          </p>
        )}
      </div>
    </div>
  )
}
