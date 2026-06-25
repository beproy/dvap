import { type ReactNode } from "react"

interface EditorLayoutProps {
  palette: ReactNode
  canvas: ReactNode
  bottomBar: ReactNode
}

export default function EditorLayout({ palette, canvas, bottomBar }: EditorLayoutProps) {
  return (
    <div
      className="grid grid-cols-[280px_1fr] grid-rows-[1fr_auto] h-[calc(100vh-12rem)] rounded-lg overflow-hidden"
      style={{ border: "0.5px solid var(--border-subtle)" }}
    >
      <aside
        className="row-start-1 col-start-1 overflow-y-auto bg-surface-elevated"
        style={{ borderRight: "0.5px solid var(--border-subtle)" }}
      >
        {palette}
      </aside>
      <section className="row-start-1 col-start-2 relative bg-surface-base">
        {canvas}
      </section>
      <footer
        className="row-start-2 col-span-2 bg-surface-elevated"
        style={{ borderTop: "0.5px solid var(--border-subtle)" }}
      >
        {bottomBar}
      </footer>
    </div>
  )
}
