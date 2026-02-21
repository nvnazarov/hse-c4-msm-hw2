from abc import ABC, abstractmethod
from typing import Any

from app.core.aha import AHA, VisitTable, to_food_source
from app.core.models import Function, Run, State
from app.core.functions import compute_mesh


class RunNotFoundError(Exception): ...


class RunNotStartedError(Exception): ...


class RunAlreadyStartedError(Exception): ...


class FunctionNotFoundError(Exception): ...


class UnexpectedError(Exception): ...


class RunRepository(ABC):
    @abstractmethod
    async def all(self) -> list[Run]: ...

    @abstractmethod
    async def get(self, id: str) -> Run | None: ...

    @abstractmethod
    async def save(self, run: Run) -> None: ...

    @abstractmethod
    async def delete(self, id: str) -> None: ...


class StateRepository(ABC):
    @abstractmethod
    async def all(self, run_id: str) -> list[State]: ...

    @abstractmethod
    async def get(self, id: str) -> State | None: ...

    @abstractmethod
    async def save(self, state: State) -> None: ...


class FunctionRepository(ABC):
    @abstractmethod
    async def all(self) -> list[Function]: ...

    @abstractmethod
    async def get(self, id: str) -> Function | None: ...


class Storage(ABC):
    runs: RunRepository
    states: StateRepository
    functions: FunctionRepository

    async def __aenter__(self) -> "Storage": ...

    async def __aexit__(self, exc_type: Any, exc: Any, traceback: Any):
        if exc:
            await self.rollback()
        else:
            await self.commit()

    @abstractmethod
    async def rollback(self) -> None: ...

    @abstractmethod
    async def commit(self) -> None: ...


class Server:
    def __init__(self, storage: Storage):
        self.storage = storage

    async def create_run(
        self,
        *,
        function_id: str,
        name: str,
        n_agents: int,
        n_dims: int,
        max_steps: int,
        low: list[float],
        up: list[float],
    ) -> Run:
        async with self.storage as tx:
            run = Run.create(
                function_id=function_id,
                name=name,
                n_agents=n_agents,
                n_dims=n_dims,
                max_steps=max_steps,
                low=low,
                up=up,
            )
            function = await tx.functions.get(function_id)
            if function is None:
                raise FunctionNotFoundError
            await tx.runs.save(run)
            return run

    async def get_all_runs(self) -> list[Run]:
        async with self.storage as tx:
            return await tx.runs.all()

    async def delete_run(self, id: str) -> None:
        async with self.storage as tx:
            await tx.runs.delete(id)

    async def get_all_states(self, run_id: str) -> list[State]:
        async with self.storage as tx:
            return await tx.states.all(run_id)

    async def start_run(self, id: str) -> State:
        async with self.storage as tx:
            run = await tx.runs.get(id)
            if not run:
                raise RunNotFoundError
            if run.state_id is not None:
                raise RunAlreadyStartedError
            function = await tx.functions.get(run.function_id)
            if function is None:
                raise UnexpectedError
            aha = AHA(
                n=run.n_agents,
                d=run.n_dims,
                max_steps=run.max_steps,
                low=to_food_source(run.low),
                up=to_food_source(run.up),
                f=function.f,
            )
            state = State.create_from_aha(run_id=run.id, aha=aha)
            await tx.states.save(state)
            run.state_id = state.id
            await tx.runs.save(run)
            return state

    async def do_one_step(self, run_id: str) -> State:
        async with self.storage as tx:
            run = await tx.runs.get(run_id)
            if not run:
                raise RunNotFoundError
            if run.state_id is None:
                raise RunNotStartedError
            state = await tx.states.get(run.state_id)
            if not state:
                raise UnexpectedError
            function = await tx.functions.get(run.function_id)
            if function is None:
                raise UnexpectedError
            aha = AHA.init_from(
                step=state.step,
                max_steps=run.max_steps,
                low=to_food_source(run.low),
                up=to_food_source(run.up),
                f=function.f,
                visit_table=VisitTable.init_from(state.visit_table),
                food_sources=[to_food_source(a) for a in state.agents],
            )
            aha.step()
            next_state = State.create_from_aha(run_id=run.id, aha=aha)
            await tx.states.save(next_state)
            run.state_id = next_state.id
            await tx.runs.save(run)
            return next_state

    async def run_until_finish(self, run_id: str) -> list[State]:
        async with self.storage as tx:
            run = await tx.runs.get(run_id)
            if not run:
                raise RunNotFoundError
            if run.state_id is None:
                raise RunNotStartedError
            state = await tx.states.get(run.state_id)
            if not state:
                raise UnexpectedError
            function = await tx.functions.get(run.function_id)
            if function is None:
                raise UnexpectedError
            aha = AHA.init_from(
                step=state.step,
                max_steps=run.max_steps,
                low=to_food_source(run.low),
                up=to_food_source(run.up),
                f=function.f,
                visit_table=VisitTable.init_from(state.visit_table),
                food_sources=[to_food_source(a) for a in state.agents],
            )
            states = list[State]()
            for _ in range(run.max_steps - state.step):
                aha.step()
                next_state = State.create_from_aha(run_id=run.id, aha=aha)
                states.append(next_state)
                await tx.states.save(next_state)
                run.state_id = next_state.id
                await tx.runs.save(run)
            return states

    async def get_all_functions(self) -> list[Function]:
        async with self.storage as tx:
            return await tx.functions.all()

    async def get_function_mesh(
        self,
        id: str,
        dims: list[float | None],
        low: list[float],
        up: list[float],
        steps: list[int],
    ):
        async with self.storage as tx:
            function = await tx.functions.get(id)
            if not function:
                raise FunctionNotFoundError
            m = compute_mesh(function.f, dims, low, up, steps)
            return m

    async def eval_function(self, id: str, dims: list[float]) -> float:
        async with self.storage as tx:
            function = await tx.functions.get(id)
            if not function:
                raise FunctionNotFoundError
            result = function.f(to_food_source(dims))
            return float(result)
