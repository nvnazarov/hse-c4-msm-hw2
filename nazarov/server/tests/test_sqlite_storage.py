from datetime import datetime, timezone

import pytest

from app.adapters.sqlite import SqliteStorage
from app.core.models import Run, State


@pytest.mark.asyncio
async def test_storage(storage: SqliteStorage):
    async with storage as tx:
        assert await tx.runs.get("1") is None
        assert await tx.states.get("1") is None

        run_1 = Run(
            id="1",
            name="test",
            state_id=None,
            function_id="1",
            n_agents=5,
            n_dims=3,
            max_steps=1000,
            low=[0, 0, 0],
            up=[1, 1, 1],
            created_at=datetime.now(tz=timezone.utc),
        )
        await tx.runs.save(run_1)
        assert await tx.runs.get(run_1.id) == run_1

        state = State(
            id="1",
            run_id=run_1.id,
            step=0,
            visit_table=[[0, 1], [2, 0]],
            agents=[[1, 3, -3], [2, 0, 5]],
            fitness=[1, 9],
            created_at=datetime.now(tz=timezone.utc),
        )
        await tx.states.save(state)
        assert await tx.states.get(state.id) == state

        run_2 = Run(
            id="2",
            name="test",
            state_id=None,
            function_id="1",
            n_agents=2,
            n_dims=2,
            max_steps=1000,
            low=[0, 0],
            up=[1, 1],
            created_at=datetime.now(tz=timezone.utc),
        )
        await tx.runs.save(run_2)
        assert await tx.runs.get(run_2.id) == run_2

        assert await tx.runs.all() == [run_2, run_1]

        await tx.runs.delete(run_1.id)
        assert await tx.runs.get(run_1.id) is None
        assert await tx.states.get(state.id) is None
