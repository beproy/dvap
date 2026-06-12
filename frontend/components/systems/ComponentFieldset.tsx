"use client"

import { Control, Controller, UseFormRegister, FieldErrors } from "react-hook-form"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COMPONENT_TYPE_LABELS, COMPONENT_TYPES, type SystemFormValues } from "@/lib/systemFormSchema"

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
    <div className="rounded-lg border border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Component {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
            aria-label="Remove component"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`components.${index}.name`} className="text-xs text-slate-400">
            Name
          </Label>
          <Input
            {...register(`components.${index}.name`)}
            id={`components.${index}.name`}
            placeholder="e.g. API Gateway"
            className="bg-slate-900 border-slate-700"
          />
          {componentErrors?.name && (
            <p className="text-xs text-red-400">{componentErrors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Type</Label>
          <Controller
            name={`components.${index}.type`}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-slate-900 border-slate-700">
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
            <p className="text-xs text-red-400">{componentErrors.type.message as string}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`components.${index}.description`} className="text-xs text-slate-400">
          Description
        </Label>
        <Textarea
          {...register(`components.${index}.description`)}
          id={`components.${index}.description`}
          placeholder="What does this component do?"
          rows={2}
          className="bg-slate-900 border-slate-700 resize-none"
        />
        {componentErrors?.description && (
          <p className="text-xs text-red-400">{componentErrors.description.message}</p>
        )}
      </div>
    </div>
  )
}
