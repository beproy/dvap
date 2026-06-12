export default function AboutPage() {
  return (
    <div className="py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">About DVAP</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">What is DVAP?</h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          DVAP (Dynamic Vulnerability &amp; Attack Path Platform) is an open-source
          security copilot for architects and engineers. You describe a software
          system, its components, and its data flows, and DVAP runs a five-agent
          AI pipeline that produces a threat model grounded in real attack data.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Every ATT&amp;CK technique ID in the output is validated against a locally
          seeded graph of 697 real MITRE techniques. Agents cannot hallucinate
          technique IDs that do not exist in the database. All outputs are stored
          in SQLite with full timing data for auditability.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">The Agent Pipeline</h2>
        <p className="text-slate-400 text-sm mb-4">
          Five specialist agents run in sequence (with STRIDE and MAESTRO in parallel):
        </p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="text-slate-500 font-mono text-sm w-6 shrink-0 pt-0.5">1.</span>
            <div>
              <span className="font-medium text-slate-200">STRIDE Agent</span>
              <p className="text-slate-400 text-sm mt-0.5">
                Applies the STRIDE threat framework (Spoofing, Tampering, Repudiation,
                Information Disclosure, Denial of Service, Elevation of Privilege) to
                each component and data flow.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-500 font-mono text-sm w-6 shrink-0 pt-0.5">2.</span>
            <div>
              <span className="font-medium text-slate-200">MAESTRO Agent</span>
              <p className="text-slate-400 text-sm mt-0.5">
                Models threats specific to AI and agentic systems. For non-AI systems,
                this agent completes immediately with no output.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-500 font-mono text-sm w-6 shrink-0 pt-0.5">3.</span>
            <div>
              <span className="font-medium text-slate-200">ATT&amp;CK Agent</span>
              <p className="text-slate-400 text-sm mt-0.5">
                Maps each identified threat to real MITRE ATT&amp;CK technique IDs from
                the local Neo4j graph. Unmapped threats are reported separately.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-500 font-mono text-sm w-6 shrink-0 pt-0.5">4.</span>
            <div>
              <span className="font-medium text-slate-200">Attack Tree Agent</span>
              <p className="text-slate-400 text-sm mt-0.5">
                Constructs 2 to 5 multi-step attack paths through the system using
                the mapped techniques, ordered by attacker sequence.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-slate-500 font-mono text-sm w-6 shrink-0 pt-0.5">5.</span>
            <div>
              <span className="font-medium text-slate-200">Controls Agent</span>
              <p className="text-slate-400 text-sm mt-0.5">
                Recommends 4 to 10 CIS Controls v8 and NIST mitigations from the
                local graph, grouped by priority: Quick wins, Standard, and Strategic.
              </p>
            </div>
          </li>
        </ol>
        <p className="text-slate-400 text-sm mt-4">
          A complete analysis on a moderately complex system typically takes 2 to 3
          minutes, limited by Gemini API latency rather than local compute.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Known Limitations</h2>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li className="flex gap-2">
            <span className="text-slate-500 mt-1">-</span>
            <span>
              ATT&amp;CK mapping coverage is partial. Roughly 50 to 75 percent of
              threats receive technique mappings depending on the system. Threats
              with no reasonable match appear in an <code className="text-slate-400 bg-slate-800 px-1 rounded text-xs">unmapped_threats</code> field.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-500 mt-1">-</span>
            <span>
              Free-tier Gemini rate limits apply. A global semaphore caps concurrent
              LLM calls at two to avoid 429 errors under load.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-500 mt-1">-</span>
            <span>
              The CIS Controls v8 dataset is a curated subset of 18 controls. Broader
              coverage is a future milestone.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-slate-500 mt-1">-</span>
            <span>
              The frontend visualization (this UI) is Phase 5 of 6. The graph view,
              findings display, and analysis runner are being built now.
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Tech Stack</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-md">
          <dt className="text-slate-500">Frontend</dt>
          <dd className="text-slate-300">Next.js 14, React Flow, TailwindCSS</dd>
          <dt className="text-slate-500">Backend</dt>
          <dd className="text-slate-300">FastAPI, LangGraph 0.2</dd>
          <dt className="text-slate-500">Graph DB</dt>
          <dd className="text-slate-300">Neo4j Community 5.20</dd>
          <dt className="text-slate-500">LLM</dt>
          <dd className="text-slate-300">Google Gemini 2.5 Flash</dd>
          <dt className="text-slate-500">Orchestration</dt>
          <dd className="text-slate-300">Docker Compose</dd>
        </dl>
      </section>
    </div>
  )
}
