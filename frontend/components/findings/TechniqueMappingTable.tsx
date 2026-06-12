import { Badge } from "@/components/ui/badge"
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
      <p className="text-sm text-slate-500 py-4 text-center">
        No technique mappings available.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-1/4">
              Threat
            </th>
            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-1/4">
              ATT&amp;CK Techniques
            </th>
            <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Rationale
            </th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m, i) => (
            <tr
              key={i}
              className="border-b border-slate-800/60 last:border-0 align-top"
            >
              <td className="py-3 pr-4 text-slate-300 text-xs leading-relaxed">
                {m.threat_title}
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-1">
                  {m.technique_ids.map((id) => (
                    <a
                      key={id}
                      href={mitreUrl(id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge className="bg-blue-900/40 text-blue-300 border-blue-800 hover:bg-blue-800/60 cursor-pointer text-xs">
                        {id}
                      </Badge>
                    </a>
                  ))}
                </div>
              </td>
              <td className="py-3 text-slate-400 text-xs leading-relaxed">
                {m.rationale}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
