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
      <p
        className="text-text-tertiary py-4 text-center"
        style={{ fontSize: "var(--text-sm)" }}
      >
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
            <h4
              className="text-text-tertiary uppercase font-medium mb-3"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wider)",
              }}
            >
              {priority}
              <span className="ml-2 font-normal normal-case">
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
