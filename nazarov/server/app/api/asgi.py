import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.core.models import Run, State
from app.core.server import (
    FunctionNotFoundError,
    RunAlreadyStartedError,
    RunNotFoundError,
    RunNotStartedError,
    Server,
)


class CreateRunPayload(BaseModel):
    function_id: str
    name: str
    n_agents: int = Field(ge=1)
    n_dims: int = Field(ge=1)
    max_steps: int = Field(ge=1)
    low: list[float]
    up: list[float]


class ASGI(FastAPI):
    def __init__(self, server: Server):
        super().__init__(summary="Artificial Hummingbird Algorithm API")

        self.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["GET", "POST", "DELETE"],
        )

        @self.get("/functions")
        async def get_all_functions():
            functions = await server.get_all_functions()
            return [{"id": f.id, "name": f.name} for f in functions]

        @self.post("/runs", status_code=status.HTTP_201_CREATED)
        async def create_run(payload: CreateRunPayload):
            try:
                run = await server.create_run(**payload.model_dump())
                return run
            except FunctionNotFoundError:
                raise HTTPException(404, "function not found")

        @self.post("/runs/{id}/start")
        async def start_run(id: str) -> State:
            try:
                state = await server.start_run(id)
                return state
            except RunNotFoundError:
                raise HTTPException(404, "run not found")
            except RunAlreadyStartedError:
                raise HTTPException(400, "run already started")

        @self.get("/runs")
        async def get_all_runs() -> list[Run]:
            runs = await server.get_all_runs()
            return runs

        @self.delete("/runs/{id}", status_code=status.HTTP_204_NO_CONTENT)
        async def delete_run(id: str):
            await server.delete_run(id)

        @self.post("/runs/{id}/step")
        async def do_one_step(id: str) -> State:
            try:
                state = await server.do_one_step(id)
                return state
            except RunNotFoundError:
                raise HTTPException(404, "run not found")
            except RunNotStartedError:
                raise HTTPException(400, "run is not started")

        @self.post("/runs/{id}/run-until-finish")
        async def run_until_finish(id: str) -> list[State]:
            try:
                states = await server.run_until_finish(id)
                return states
            except RunNotFoundError:
                raise HTTPException(404, "run not found")
            except RunNotStartedError:
                raise HTTPException(400, "run is not started")

        @self.get("/runs/{id}/states")
        async def get_all_states(id: str) -> list[State]:
            try:
                states = await server.get_all_states(id)
                return states
            except RunNotFoundError:
                raise HTTPException(404, "run not found")

    def listen_and_serve(self, host: str = "127.0.0.1", port: int = 8080):
        uvicorn.run(self, host=host, port=port)
