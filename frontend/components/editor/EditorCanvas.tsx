"use client"

import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react"
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from "reactflow"
import "reactflow/dist/style.css"
import ComponentNode from "@/components/graph/ComponentNode"
import FlowEdge from "@/components/graph/FlowEdge"
import PropertyPanel from "./PropertyPanel"
import type { ComponentType } from "@/lib/types"

const nodeTypes = { component: ComponentNode }
const edgeTypes = { flow: FlowEdge }

const DEFAULT_LABELS: Record<string, string> = {
  web_app:  "New web app",
  service:  "New service",
  gateway:  "New API gateway",
  database: "New database",
  auth:     "New auth provider",
  queue:    "New queue",
  storage:  "New storage",
  external: "New external system",
  other:    "New component",
}

type SelectedElement =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null

export interface CanvasHandle {
  getCanvasData: () => { nodes: Node[]; edges: Edge[] }
}

const EditorCanvasInner = forwardRef<CanvasHandle>(
  function EditorCanvasInner(_, ref) {
    const { screenToFlowPosition } = useReactFlow()
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [selectedElement, setSelectedElement] = useState<SelectedElement>(null)

    useImperativeHandle(
      ref,
      () => ({ getCanvasData: () => ({ nodes, edges }) }),
      [nodes, edges],
    )

    // Clear panel when the selected node/edge is removed from the canvas
    useEffect(() => {
      if (!selectedElement) return
      if (
        selectedElement.kind === "node" &&
        !nodes.some((n) => n.id === selectedElement.id)
      ) {
        setSelectedElement(null)
      } else if (
        selectedElement.kind === "edge" &&
        !edges.some((e) => e.id === selectedElement.id)
      ) {
        setSelectedElement(null)
      }
    }, [nodes, edges, selectedElement])

    // Esc key clears selection
    useEffect(() => {
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") setSelectedElement(null)
      }
      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    // ── Drop from palette ──────────────────────────────────────────────────────

    const onDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }, [])

    const onDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        const raw = e.dataTransfer.getData("application/reactflow")
        if (!raw) return

        let componentType: ComponentType
        try {
          componentType = (JSON.parse(raw) as { type: ComponentType }).type
        } catch {
          return
        }

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
        const newNode: Node = {
          id: crypto.randomUUID(),
          type: "component",
          position,
          data: {
            label: DEFAULT_LABELS[componentType] ?? `New ${componentType.replace(/_/g, " ")}`,
            component_type: componentType,
            description: "",
          },
        }
        setNodes((nds) => [...nds, newNode])
      },
      [screenToFlowPosition, setNodes],
    )

    // ── Edge creation ──────────────────────────────────────────────────────────

    const onConnect = useCallback(
      (connection: Connection) => {
        setEdges((eds) =>
          addEdge(
            { ...connection, type: "flow", data: { data_type: "", protocol: "", is_encrypted: false } },
            eds,
          )
        )
      },
      [setEdges],
    )

    // ── Selection ──────────────────────────────────────────────────────────────

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
      setSelectedElement({ kind: "node", id: node.id })
    }, [])

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
      setSelectedElement({ kind: "edge", id: edge.id })
    }, [])

    const onPaneClick = useCallback(() => {
      setSelectedElement(null)
    }, [])

    // ── Mutation callbacks for PropertyPanel ───────────────────────────────────

    const handleNodeNameChange = useCallback(
      (name: string) => {
        if (!selectedElement || selectedElement.kind !== "node") return
        const id = selectedElement.id
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: name } } : n))
        )
      },
      [selectedElement, setNodes],
    )

    const handleNodeDescriptionChange = useCallback(
      (desc: string) => {
        if (!selectedElement || selectedElement.kind !== "node") return
        const id = selectedElement.id
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, description: desc } } : n))
        )
      },
      [selectedElement, setNodes],
    )

    const handleEdgeDataTypeChange = useCallback(
      (val: string) => {
        if (!selectedElement || selectedElement.kind !== "edge") return
        const id = selectedElement.id
        setEdges((eds) =>
          eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, data_type: val } } : e))
        )
      },
      [selectedElement, setEdges],
    )

    const handleEdgeProtocolChange = useCallback(
      (val: string) => {
        if (!selectedElement || selectedElement.kind !== "edge") return
        const id = selectedElement.id
        setEdges((eds) =>
          eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, protocol: val } } : e))
        )
      },
      [selectedElement, setEdges],
    )

    const handleEdgeEncryptedChange = useCallback(
      (val: boolean) => {
        if (!selectedElement || selectedElement.kind !== "edge") return
        const id = selectedElement.id
        setEdges((eds) =>
          eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, is_encrypted: val } } : e))
        )
      },
      [selectedElement, setEdges],
    )

    const handleDeleteNode = useCallback(() => {
      if (!selectedElement || selectedElement.kind !== "node") return
      const id = selectedElement.id
      setNodes((nds) => nds.filter((n) => n.id !== id))
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    }, [selectedElement, setNodes, setEdges])

    const handleDeleteEdge = useCallback(() => {
      if (!selectedElement || selectedElement.kind !== "edge") return
      const id = selectedElement.id
      setEdges((eds) => eds.filter((e) => e.id !== id))
    }, [selectedElement, setEdges])

    // ── Derived data for PropertyPanel ─────────────────────────────────────────

    const selectedNode =
      selectedElement?.kind === "node"
        ? (nodes.find((n) => n.id === selectedElement.id) ?? null)
        : null

    const selectedEdge =
      selectedElement?.kind === "edge"
        ? (edges.find((e) => e.id === selectedElement.id) ?? null)
        : null

    const sourceNodeName = selectedEdge
      ? ((nodes.find((n) => n.id === selectedEdge.source)?.data?.label as string) ?? "")
      : ""

    const destNodeName = selectedEdge
      ? ((nodes.find((n) => n.id === selectedEdge.target)?.data?.label as string) ?? "")
      : ""

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
      <div className="w-full h-full relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          deleteKeyCode={["Delete", "Backspace"]}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.2}
          maxZoom={2}
          className="bg-surface-base"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a2330" />
          <Controls
            style={{ bottom: 16, right: 16, left: "auto", top: "auto" }}
            showInteractive={false}
          />
          <MiniMap
            style={{
              top: 16, right: 16, bottom: "auto", left: "auto",
              backgroundColor: "#0e1620",
              border: "0.5px solid #1a2330",
            }}
            nodeColor={() => "#131c28"}
            maskColor="rgba(11, 17, 23, 0.85)"
          />
        </ReactFlow>

        <PropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          sourceNodeName={sourceNodeName}
          destNodeName={destNodeName}
          onNodeNameChange={handleNodeNameChange}
          onNodeDescriptionChange={handleNodeDescriptionChange}
          onEdgeDataTypeChange={handleEdgeDataTypeChange}
          onEdgeProtocolChange={handleEdgeProtocolChange}
          onEdgeEncryptedChange={handleEdgeEncryptedChange}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onClose={() => setSelectedElement(null)}
        />
      </div>
    )
  }
)

const EditorCanvas = forwardRef<CanvasHandle>(function EditorCanvas(_, ref) {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner ref={ref} />
    </ReactFlowProvider>
  )
})

export default EditorCanvas
