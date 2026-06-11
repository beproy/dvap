"""
LangGraph orchestration graph for DVAP analysis runs.

Topology:
  START → run_stride  ─┐
  START → run_maestro ─┤→ run_attack → run_attack_tree → run_controls → run_finalize → END

STRIDE and MAESTRO run in parallel (both fan out from START).
LangGraph waits for both before advancing to the ATT&CK node.

Node names use a "run_" prefix to avoid clashing with same-named keys in
AnalysisState — LangGraph 0.2+ rejects node names that duplicate state keys.
"""

import logging

from langgraph.graph import END, START, StateGraph

from app.orchestrator.nodes import (
    attack_node,
    attack_tree_node,
    controls_node,
    finalize_node,
    maestro_node,
    stride_node,
)
from app.orchestrator.state import AnalysisState

log = logging.getLogger(__name__)

_orchestrator = None


def build_orchestrator():
    """Build and compile the LangGraph analysis orchestrator."""
    graph = StateGraph(AnalysisState)

    graph.add_node("run_stride", stride_node)
    graph.add_node("run_maestro", maestro_node)
    graph.add_node("run_attack", attack_node)
    graph.add_node("run_attack_tree", attack_tree_node)
    graph.add_node("run_controls", controls_node)
    graph.add_node("run_finalize", finalize_node)

    # STRIDE and MAESTRO fan out from START (run in parallel)
    graph.add_edge(START, "run_stride")
    graph.add_edge(START, "run_maestro")

    # Both must complete before ATT&CK runs (LangGraph fan-in)
    graph.add_edge("run_stride", "run_attack")
    graph.add_edge("run_maestro", "run_attack")

    # Linear chain from ATT&CK onwards
    graph.add_edge("run_attack", "run_attack_tree")
    graph.add_edge("run_attack_tree", "run_controls")
    graph.add_edge("run_controls", "run_finalize")
    graph.add_edge("run_finalize", END)

    compiled = graph.compile()
    log.info(
        "Orchestrator compiled — "
        "topology: START→(run_stride‖run_maestro)→run_attack→run_attack_tree→run_controls→run_finalize→END"
    )
    return compiled


def get_orchestrator():
    """Return the singleton compiled orchestrator, building it on first call."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = build_orchestrator()
    return _orchestrator
