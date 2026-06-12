import type { ControlRecommendation } from "@/lib/types"
import ControlCard from "./ControlCard"

const PRIORITY_ORDER: ControlRecommendation["priority"][] = [
  "Quick win",
  "Standard",
  "Strategic",
]

interface Props {
  controls: ControlRecommendation[]
}

export default function ControlsList({ controls }: Props) {
  if (controls.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        No control recommendations available.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {PRIORITY_ORDER.map((priority) => {
        const group = controls.filter((c) => c.priority === priority)
        if (group.length === 0) return null
        return (
          <div key={priority}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {priority}
              <span className="ml-2 text-slate-600 font-normal normal-case">
                ({group.length})
              </span>
            </h4>
            <div className="space-y-3">
              {group.map((control, i) => (
                <ControlCard key={`${control.control_id}-${i}`} control={control} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
