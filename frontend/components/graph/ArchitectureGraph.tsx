"use client"

import { useEffect, useCallback } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "reactflow"
import dagre from "dagre"
import "reactflow/dist/style.css"
import { useSystemGraph } from "@/hooks/useSystemGraph"
import ComponentNode from "./ComponentNode"
import ThreatNode from "./ThreatNode"
import FlowEdge from "./FlowEdge"
import type { GraphNode, GraphEdge } from "@/lib/types"

const NODE_W = 200
const NODE_H = 72
const THREAT_W = 180
const THREAT_H = 64

const nodeTypes = {
  component: ComponentNode,
  threat: ThreatNode,
}

const edgeTypes = {
  flow: FlowEdge,
  targets: FlowEdge,
}

function buildLayout(
  rawNodes: GraphNode[],
  rawEdges: GraphEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: "LR",
    nodesep: 70,
    ranksep: 160,
    marginx: 40,
    marginy: 40,
  })

  rawNodes.forEach((n) => {
    const isThreat = n.type === "threat"
    g.setNode(n.id, { width: isThreat ? THREAT_W : NODE_W, height: isThreat ? THREAT_H : NODE_H })
  })

  rawEdges.forEach((e) => {
    g.setEdge(e.source, e.target)
  })

  dagre.layout(g)

  const nodes: Node[] = rawNodes.map((n) => {
    const pos = g.node(n.id)
    const isThreat = n.type === "threat"
    const w = isThreat ? THREAT_W : NODE_W
    const h = isThreat ? THREAT_H : NODE_H
    return {
      id: n.id,
      type: n.type === "threat" ? "threat" : "component",
      position: { x: pos.x - w / 2, y: pos.y - h / 2 },
      data: { label: n.label, ...n.data },
    }
  })

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type === "targets" ? "targets" : "flow",
    data: e.data,
  }))

  return { nodes, edges }
}

interface Props {
  systemId: string
}

export default function ArchitectureGraph({ systemId }: Props) {
  const { data: graph, error, isLoading, mutate } = useSystemGraph(systemId)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (graph && graph.nodes.length > 0) {
      const layout = buildLayout(graph.nodes, graph.edges)
      setNodes(layout.nodes)
      setEdges(layout.edges)
    }
  }, [graph, setNodes, setEdges])

  const onInit = useCallback((instance: ReactFlowInstance) => {
    instance.fitView({ padding: 0.2 })
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-slate-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading graph...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <div>
          <p className="text-red-400 text-sm font-medium">Failed to load graph</p>
          <p className="text-slate-500 text-xs mt-1">{error.message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <p className="text-slate-400 text-sm">No components found.</p>
        <p className="text-slate-500 text-xs">Run an analysis to populate the graph with threats.</p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      className="bg-slate-950"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1}
        color="#334155"
      />
      <Controls
        style={{ bottom: 16, left: 16, top: "auto" }}
        showInteractive={false}
      />
      <MiniMap
        style={{ bottom: 16, right: 16 }}
        nodeColor={(n) => (n.type === "threat" ? "#ef4444" : "#3b82f6")}
        maskColor="rgba(2, 6, 23, 0.8)"
      />
    </ReactFlow>
  )
}
