"use client"

import { Control, Controller, UseFormRegister, FieldErrors, useWatch } from "react-hook-form"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SystemFormValues } from "@/lib/systemFormSchema"

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
    <div className="rounded-lg border border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Flow {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
            aria-label="Remove data flow"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Source</Label>
          <Controller
            name={`data_flows.${index}.source`}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={componentNames.length === 0}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700">
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
            <p className="text-xs text-red-400">{flowErrors.source.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Destination</Label>
          <Controller
            name={`data_flows.${index}.destination`}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={destinationOptions.length === 0}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700">
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
            <p className="text-xs text-red-400">{flowErrors.destination.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label
            htmlFor={`data_flows.${index}.data_type`}
            className="text-xs text-slate-400"
          >
            Data Type
          </Label>
          <Input
            {...register(`data_flows.${index}.data_type`)}
            id={`data_flows.${index}.data_type`}
            placeholder="e.g. JSON over HTTPS"
            className="bg-slate-900 border-slate-700"
          />
          {flowErrors?.data_type && (
            <p className="text-xs text-red-400">{flowErrors.data_type.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`data_flows.${index}.protocol`}
            className="text-xs text-slate-400"
          >
            Protocol
          </Label>
          <Input
            {...register(`data_flows.${index}.protocol`)}
            id={`data_flows.${index}.protocol`}
            placeholder="e.g. HTTPS"
            className="bg-slate-900 border-slate-700"
          />
          {flowErrors?.protocol && (
            <p className="text-xs text-red-400">{flowErrors.protocol.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register(`data_flows.${index}.is_encrypted`)}
          id={`data_flows.${index}.is_encrypted`}
          className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
        />
        <Label
          htmlFor={`data_flows.${index}.is_encrypted`}
          className="text-xs text-slate-400 cursor-pointer"
        >
          Encrypted in transit
        </Label>
      </div>
    </div>
  )
}
