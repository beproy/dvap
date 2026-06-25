import type { AttackPath } from "@/lib/types"
import AttackPathView from "./AttackPathView"

interface Props {
  paths: AttackPath[]
}

export default function AttackPathsList({ paths }: Props) {
  if (paths.length === 0) {
    return (
      <p
        className="text-text-tertiary py-4 text-center"
        style={{ fontSize: "var(--text-sm)" }}
      >
        No attack paths identified.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {paths.map((path, i) => (
        <AttackPathView key={path.path_id ?? i} path={path} />
      ))}
    </div>
  )
}
