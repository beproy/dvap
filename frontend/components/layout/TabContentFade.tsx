"use client"

import { useRef, useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"

export default function TabContentFade({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.classList.remove("tab-fade-in")
    void el.offsetWidth // force reflow so animation restarts on route change
    el.classList.add("tab-fade-in")
  }, [pathname])

  return (
    <div ref={containerRef} className="tab-fade-in">
      {children}
    </div>
  )
}
