from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field

from app.core.aha import AHA, FitnessFunction


class Function(BaseModel):
    id: str
    name: str
    f: FitnessFunction


class State(BaseModel):
    id: str
    run_id: str
    step: int = Field(ge=0)
    visit_table: list[list[int]] = Field(min_length=1)
    agents: list[list[float]] = Field(min_length=1)
    fitness: list[float] = Field(min_length=1)
    created_at: datetime

    def model_post_init(self, _: Any):
        if len(self.visit_table) != len(self.visit_table[0]):
            raise ValueError("visit table must be a square matrix")
        if len(self.visit_table) != len(self.agents):
            raise ValueError("visit table size must be equal to agents size")
        if len(self.fitness) != len(self.agents):
            raise ValueError("fitness size must be equal to agents size")

    @staticmethod
    def create_from_aha(*, run_id: str, aha: AHA) -> "State":
        return State(
            id=uuid4().hex,
            run_id=run_id,
            step=aha.get_step(),
            visit_table=aha.get_visit_table().tolist(),
            agents=list(map(lambda h: h.get_food_source().tolist(), aha.hummingbirds)),
            fitness=list(map(lambda h: float(h.get_fitness_value()), aha.hummingbirds)),
            created_at=datetime.now(tz=timezone.utc),
        )


class Run(BaseModel):
    id: str
    name: str
    state_id: str | None
    function_id: str
    n_agents: int = Field(ge=1)
    n_dims: int = Field(ge=1)
    max_steps: int = Field(ge=1)
    low: list[float]
    up: list[float]
    created_at: datetime

    def model_post_init(self, _: Any):
        if len(self.low) != self.n_dims or len(self.up) != self.n_dims:
            raise ValueError("lower or upper bound has incorrect dimentions number")

    @staticmethod
    def create(
        *,
        function_id: str,
        name: str,
        n_agents: int,
        n_dims: int,
        max_steps: int,
        low: list[float],
        up: list[float],
    ) -> "Run":
        id = uuid4().hex
        return Run(
            id=id,
            name=name or "untitled",
            state_id=None,
            function_id=function_id,
            n_agents=n_agents,
            n_dims=n_dims,
            max_steps=max_steps,
            low=low,
            up=up,
            created_at=datetime.now(tz=timezone.utc),
        )
