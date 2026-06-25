import type { ControlRecommendation } from "@/lib/types"

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "Quick win") {
    return (
      <span
        className="uppercase font-medium shrink-0"
        style={{
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-wide)",
          color: "var(--severity-low)",
        }}
      >
        {priority}
      </span>
    )
  }
  if (priority === "Strategic") {
    return (
      <span
        className="uppercase font-medium shrink-0 px-2 py-0.5 rounded"
        style={{
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-wide)",
          color: "var(--accent)",
          background: "var(--accent-muted)",
        }}
      >
        {priority}
      </span>
    )
  }
  return (
    <span
      className="uppercase font-medium shrink-0 text-text-secondary"
      style={{
        fontSize: "var(--text-xs)",
        letterSpacing: "var(--tracking-wide)",
      }}
    >
      {priority}
    </span>
  )
}

interface Props {
  control: ControlRecommendation
}

export default function ControlCard({ control }: Props) {
  return (
    <div className="rounded-lg bg-surface-raised p-4 space-y-3">
      {/* Top row: IDs on left, priority badge on right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-text-tertiary"
            style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
          >
            {control.control_id}
          </span>
          <span
            className="text-text-tertiary px-1.5 py-0.5 rounded"
            style={{
              border: "0.5px solid var(--border-subtle)",
              fontSize: "var(--text-xs)",
            }}
          >
            {control.framework}
          </span>
        </div>
        <PriorityBadge priority={control.priority} />
      </div>

      {/* Control name */}
      <p
        className="text-text-primary font-medium"
        style={{ fontSize: "var(--text-base)" }}
      >
        {control.name}
      </p>

      {/* Implementation notes */}
      {control.implementation_notes && (
        <p
          className="text-text-secondary"
          style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}
        >
          {control.implementation_notes}
        </p>
      )}

      {/* Addresses threats */}
      {control.addresses_threats.length > 0 && (
        <div>
          <p
            className="text-text-tertiary uppercase font-medium mb-1"
            style={{
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Addresses threats
          </p>
          <ul className="space-y-0.5">
            {control.addresses_threats.map((t, i) => (
              <li
                key={i}
                className="text-text-secondary flex gap-1.5"
                style={{ fontSize: "var(--text-xs)" }}
              >
                <span className="text-text-tertiary shrink-0">-</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Addresses techniques */}
      {control.addresses_techniques.length > 0 && (
        <div>
          <p
            className="text-text-tertiary uppercase font-medium mb-1"
            style={{
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Addresses techniques
          </p>
          <div className="flex flex-wrap gap-2">
            {control.addresses_techniques.map((id) => (
              <span
                key={id}
                className="text-text-secondary"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                }}
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
