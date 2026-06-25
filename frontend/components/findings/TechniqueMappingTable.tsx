import type { TechniqueMapping } from "@/lib/types"

function mitreUrl(id: string): string {
  if (id.includes(".")) {
    const dotIndex = id.indexOf(".")
    const base = id.slice(0, dotIndex)
    const sub = id.slice(dotIndex + 1)
    return `https://attack.mitre.org/techniques/${base}/${sub}/`
  }
  return `https://attack.mitre.org/techniques/${id}/`
}

interface Props {
  mappings: TechniqueMapping[]
}

export default function TechniqueMappingTable({ mappings }: Props) {
  if (mappings.length === 0) {
    return (
      <p
        className="text-text-tertiary py-4 text-center"
        style={{ fontSize: "var(--text-sm)" }}
      >
        No technique mappings available.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
            <th
              className="text-left py-2 pr-4 text-text-tertiary uppercase font-medium"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wide)",
                width: "25%",
              }}
            >
              Threat
            </th>
            <th
              className="text-left py-2 pr-4 text-text-tertiary uppercase font-medium"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wide)",
                width: "20%",
              }}
            >
              ATT&amp;CK Techniques
            </th>
            <th
              className="text-left py-2 text-text-tertiary uppercase font-medium"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              Rationale
            </th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m, i) => (
            <tr
              key={i}
              className="align-top last:border-0 hover:bg-surface-elevated transition-colors"
              style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
            >
              <td
                className="py-3 pr-4 text-text-secondary leading-relaxed"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {m.threat_title}
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-2">
                  {m.technique_ids.map((id) => (
                    <a
                      key={id}
                      href={mitreUrl(id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--accent)",
                      }}
                    >
                      {id}
                    </a>
                  ))}
                </div>
              </td>
              <td
                className="py-3 text-text-secondary leading-relaxed"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {m.rationale}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
