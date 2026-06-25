import { type ReactNode } from "react"

interface EditorLayoutProps {
  palette: ReactNode
  canvas: ReactNode
  bottomBar: ReactNode
}

export default function EditorLayout({ palette, canvas, bottomBar }: EditorLayoutProps) {
  return (
    <div className="grid grid-cols-[320px_1fr] grid-rows-[1fr_auto] h-[calc(100vh-12rem)] border border-slate-800 rounded-lg overflow-hidden">
      <aside className="row-start-1 col-start-1 border-r border-slate-800 overflow-y-auto bg-slate-900">
        {palette}
      </aside>
      <section className="row-start-1 col-start-2 relative bg-slate-950">
        {canvas}
      </section>
      <footer className="row-start-2 col-span-2 border-t border-slate-800 bg-slate-900">
        {bottomBar}
      </footer>
    </div>
  )
}
