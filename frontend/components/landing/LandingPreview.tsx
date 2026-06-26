"use client"

import ReactFlow, {
  ReactFlowProvider,
  type Node,
  type Edge,
} from "reactflow"
import "reactflow/dist/style.css"
import ComponentNode from "@/components/graph/ComponentNode"
import ThreatNode from "@/components/graph/ThreatNode"

const nodeTypes = { component: ComponentNode, threat: ThreatNode }

// Layout: top row User→Web App→API Gateway→Customer DB
//         second row: Auth Service (branches from API Gateway)
//         second row left: SQL Injection threat (targets Customer DB)
const NODES: Node[] = [
  {
    id: "user",
    type: "component",
    position: { x: 0, y: 0 },
    data: { label: "User", component_type: "external" },
  },
  {
    id: "web-app",
    type: "component",
    position: { x: 190, y: 0 },
    data: { label: "Web App", component_type: "web_app" },
  },
  {
    id: "api-gw",
    type: "component",
    position: { x: 380, y: 0 },
    data: { label: "API Gateway", component_type: "gateway" },
  },
  {
    id: "customer-db",
    type: "component",
    position: { x: 570, y: 0 },
    data: { label: "Customer DB", component_type: "database" },
  },
  {
    id: "auth-service",
    type: "component",
    position: { x: 480, y: 120 },
    data: { label: "Auth Service", component_type: "auth" },
  },
  {
    id: "threat",
    type: "threat",
    position: { x: 200, y: 120 },
    data: { label: "SQL Injection", impact: "High" },
  },
]

const EDGES: Edge[] = [
  {
    id: "e1",
    source: "user",
    target: "web-app",
    type: "smoothstep",
    style: { stroke: "var(--border-default)", strokeWidth: 1 },
  },
  {
    id: "e2",
    source: "web-app",
    target: "api-gw",
    type: "smoothstep",
    style: { stroke: "var(--border-default)", strokeWidth: 1 },
  },
  {
    id: "e3",
    source: "api-gw",
    target: "customer-db",
    type: "smoothstep",
    style: { stroke: "var(--border-default)", strokeWidth: 1 },
  },
  {
    id: "e4",
    source: "api-gw",
    target: "auth-service",
    type: "smoothstep",
    style: { stroke: "var(--border-default)", strokeWidth: 1 },
  },
  {
    id: "e5",
    source: "threat",
    target: "customer-db",
    type: "straight",
    style: {
      stroke: "var(--severity-critical)",
      strokeWidth: 1,
      strokeDasharray: "5 3",
      opacity: 0.75,
    },
  },
]

function PreviewInner() {
  return (
    <ReactFlow
      nodes={NODES}
      edges={EDGES}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      className="bg-surface-base"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(77, 208, 225, 0.05) 1px, transparent 0)",
        backgroundSize: "20px 20px",
      }}
    />
  )
}

export default function LandingPreview() {
  return (
    <ReactFlowProvider>
      <PreviewInner />
    </ReactFlowProvider>
  )
}
