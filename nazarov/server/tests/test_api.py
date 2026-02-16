from typing import Any

import pytest
from httpx import AsyncClient
from pydantic import RootModel


def is_float_list(obj: Any, n: int):
    list_ = RootModel[list[float]].model_validate(obj).root
    return len(list_) == n


def is_int_matrix(obj: Any, n: int, m: int):
    matrix = RootModel[list[list[int]]].model_validate(obj).root
    if len(matrix) != n:
        return False
    for row in matrix:
        if len(row) != m:
            return False
    return True


def is_float_matrix(obj: Any, n: int, m: int):
    matrix = RootModel[list[list[float]]].model_validate(obj).root
    if len(matrix) != n:
        return False
    for row in matrix:
        if len(row) != m:
            return False
    return True


@pytest.mark.asyncio
async def test_api(client: AsyncClient):
    resp = await client.get("/functions")
    assert resp.status_code == 200
    assert resp.json() == [
        {"id": "1", "name": "rastrigin"},
        {"id": "2", "name": "rosenbrok"},
        {"id": "3", "name": "stepint"},
    ]

    resp = await client.get("/runs")
    assert resp.status_code == 200
    assert resp.json() == []

    resp = await client.post(
        "/runs",
        json={
            "function_id": "1",
            "name": "test",
            "n_agents": 5,
            "n_dims": 2,
            "max_steps": 10,
            "low": [0, 0],
            "up": [1, 1],
        },
    )
    assert resp.status_code == 201
    run = resp.json()
    assert run["function_id"] == "1"
    assert run["name"] == "test"
    assert run["n_agents"] == 5
    assert run["n_dims"] == 2
    assert run["max_steps"] == 10
    assert run["low"] == [0, 0]
    assert run["up"] == [1, 1]
    assert run["state_id"] is None
    assert type(run_id := run["id"]) is str

    resp = await client.get("/runs")
    assert resp.status_code == 200
    assert resp.json() == [run]

    resp = await client.post(f"/runs/{run_id}/start")
    assert resp.status_code == 200
    state = resp.json()
    assert type(state["id"]) is str
    assert state["step"] == 0
    assert state["run_id"] == run_id
    assert is_int_matrix(state["visit_table"], 5, 5)
    assert is_float_matrix(state["agents"], 5, 2)
    assert is_float_list(state["fitness"], 5)

    resp = await client.post(f"/runs/{run_id}/step")
    assert resp.status_code == 200
    state = resp.json()
    assert type(state["id"]) is str
    assert state["step"] == 1
    assert state["run_id"] == run_id
    assert is_int_matrix(state["visit_table"], 5, 5)
    assert is_float_matrix(state["agents"], 5, 2)
    assert is_float_list(state["fitness"], 5)

    resp = await client.post(f"/runs/{run_id}/run-until-finish")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 9

    resp = await client.get(f"/runs/{run_id}/states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 11

    resp = await client.delete(f"/runs/{run_id}")
    assert resp.status_code == 204
    assert resp.text == ""

    resp = await client.get("/runs")
    assert resp.status_code == 200
    assert resp.json() == []
