export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-auto py-4">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-slate-500">
        <span>DVAP v0.5.0 (Phase 5)</span>
        <a
          href="https://github.com/beproy/dvap"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-300 transition-colors"
        >
          github.com/beproy/dvap
        </a>
      </div>
    </footer>
  )
}
