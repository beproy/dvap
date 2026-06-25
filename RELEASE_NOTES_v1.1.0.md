# Release Notes - v1.1.0 (2026-06-25)

DVAP v1.1.0 adds a visual system editor, story mode for attack paths, and a complete
UI refresh with the Direction C design language.

---

## Visual System Editor

A new creation path at `/systems/new/visual` lets users build system diagrams by
dragging and dropping components onto a React Flow canvas:

- Nine component types available in the palette (Web App, Service, API Gateway, Database,
  Auth Provider, Queue, Storage, External System, Other), each with a Lucide icon and
  a one-line description
- Draw data flow connections by dragging from one node's handle to another
- Click any node or edge to open a property panel that slides in from the right:
  - Nodes: editable name, read-only type, description textarea, delete button
  - Edges: data type, protocol, encrypted checkbox, delete button
- Inline validation before save: name and description required, at least 2 components,
  at least 1 data flow, all component names must be unique, no self-flows
- On save, converts canvas state to the same `CreateSystemRequest` shape used by the
  form-based flow and calls the existing `POST /api/systems` endpoint
- Redirects to the new system's Architecture tab on success
- The original form-based creation at `/systems/new` is unchanged; both paths coexist

---

## Story Mode for Attack Paths

Attack paths on the Findings page now support animated, step-by-step playback.

**Inline Story Mode:**
- Play, Pause, Restart, and Replay controls on each attack path card
- Speed selector: 0.5x (slow), 1x (normal), 2x (fast) -- 800ms, 400ms, 200ms per step
- Steps start at opacity 0.2; each step fades to full opacity as the story reaches it
- Step reveal animation: 4px upward lift combined with the opacity fade, using the
  easing-emphasis curve so the motion feels springy rather than mechanical
- Arrows between steps fade in with the step they connect

**Presentation Story Mode:**
- "Present" button on each attack path opens a full-screen takeover
- One step at a time, centered, with the technique ID large in the accent color
- Step counter ("Step N of M") and dot indicators at the bottom
- Top progress bar advances with each step
- Keyboard controls: Space or ArrowRight to advance, ArrowLeft to go back, Esc to close
- Auto-advances every 4 seconds; any keyboard interaction disables auto-advance for
  the session

---

## Direction C UI Refresh

A complete design token system (`frontend/app/design-tokens.css`) replaces all
hard-coded Tailwind colors throughout the frontend:

**Palette:**
- Four surface levels: `--surface-base` (deep navy), `--surface-raised`, `--surface-elevated`,
  `--surface-overlay`
- Three border weights: `--border-subtle`, `--border-default`, `--border-strong`
- Four text levels: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled`
- Single accent color: `--accent` (#4dd0e1), used on at most three elements per screen
- Severity colors reserved exclusively for severity contexts (threats, errors)
- Status colors for run state (pending, running, completed, failed)

**Typography:**
- Inter loaded via `next/font/google` as the primary sans-serif
- JetBrains Mono loaded via `next/font/google` for all IDs (ATT&CK technique IDs,
  control IDs, run IDs)
- Seven type sizes from `--text-xs` (11px) through `--text-2xl` (32px)

**Per-page highlights:**
- Architecture graph: dark navy nodes, severity-colored left borders on threat nodes,
  cyan accent on selected node border
- Findings page: 5-tile metrics row, severity-coded left borders on threat cards,
  monospaced technique IDs, severity-labeled controls with Strategic badge in accent color
- Visual editor: direction-C palette panel, canvas background with subtle dot pattern,
  property panel with sliding transition
- All forms: subtle 0.5px borders, accent-colored focus state, accent-filled Save button
- Error boundaries: critical-severity left border, AlertTriangle icon in severity color
- Loading skeletons: shimmer between surface-raised and surface-elevated over 1.5s

**Signature motion (all respect `prefers-reduced-motion`):**
- Status badge: 300ms cyan box-shadow expansion when an analysis transitions to "completed"
- Story mode step reveal: 4px upward lift with opacity fade using easing-emphasis curve
- Property panel: CSS transform slide with `--duration-normal` and `--easing-default`
- Tab switch: opacity fade over `--duration-fast` when switching Architecture/Findings/Runs

---

## Upgrade Path

No data migrations required. The visual editor uses the same `POST /api/systems` endpoint
as the form. Existing systems and analysis runs are unaffected.

---

## Known Limitations (unchanged from v1.0.0)

- ATT&CK mapping coverage is partial. Roughly 50-75% of threats receive technique mappings
  depending on the system. Unmapped threats are reported in the `unmapped_threats` field.
- Free-tier Gemini rate limits apply. Analysis may slow under concurrent load.
- CIS Controls v8 dataset is a curated subset of 18 controls.
