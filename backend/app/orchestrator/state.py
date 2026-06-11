from operator import add
from typing import Annotated, TypedDict

from app.agents.attack import AttackOutput
from app.agents.attack_tree import AttackTreeOutput
from app.agents.controls import ControlsOutput
from app.agents.maestro import MaestroOutput
from app.agents.stride import StrideOutput
from app.schemas.system import SystemDescription


def merge_dicts(a: dict, b: dict) -> dict:
    return {**a, **b}


class AnalysisState(TypedDict):
    # Inputs (set once at graph invocation)
    run_id: str
    system_id: str
    system: SystemDescription

    # Agent outputs (None until the node runs)
    stride: StrideOutput | None
    maestro: MaestroOutput | None
    attack: AttackOutput | None
    attack_tree: AttackTreeOutput | None
    controls: ControlsOutput | None

    # Accumulating fields — reducers allow parallel stride/maestro writes
    errors: Annotated[list[str], add]
    timings: Annotated[dict[str, float], merge_dicts]
