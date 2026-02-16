import pathlib
import sqlite3
from typing import Any

from pydantic import RootModel

from app.adapters.static import StaticFunctionRepository
from app.core.models import Run, State
from app.core.server import RunRepository, StateRepository, Storage


def as_float_list(obj: Any):
    return RootModel[list[float]].model_validate_json(obj).root


def as_float_matrix(obj: Any):
    return RootModel[list[list[float]]].model_validate_json(obj).root


def as_int_matrix(obj: Any):
    return RootModel[list[list[int]]].model_validate_json(obj).root


class SqliteRunRepository(RunRepository):
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    @staticmethod
    def load(row: Any) -> Run:
        return Run(
            id=row[0],
            name=row[1],
            state_id=row[2],
            function_id=row[3],
            n_agents=row[4],
            n_dims=row[5],
            max_steps=row[6],
            low=as_float_list(row[7]),
            up=as_float_list(row[8]),
            created_at=row[9],
        )

    @staticmethod
    def dump(run: Run):
        return (
            run.id,
            run.name,
            run.state_id,
            run.function_id,
            run.n_agents,
            run.n_dims,
            run.max_steps,
            str(run.low),
            str(run.up),
            run.created_at,
        )

    async def all(self) -> list[Run]:
        cursor = self._conn.cursor()
        cursor.execute(
            "SELECT "
            "   id, "
            "   name, "
            "   state_id, "
            "   function_id, "
            "   n_dims, "
            "   n_agents, "
            "   max_steps, "
            "   low, "
            "   up, "
            "   created_at "
            "FROM "
            "   runs "
            "ORDER BY "
            "   created_at DESC",
        )
        runs = [self.load(row) for row in cursor.fetchall()]
        cursor.close()
        return runs

    async def get(self, id: str) -> Run | None:
        cursor = self._conn.cursor()
        cursor.execute(
            "SELECT "
            "   id, "
            "   name, "
            "   state_id, "
            "   function_id, "
            "   n_dims, "
            "   n_agents, "
            "   max_steps, "
            "   low, "
            "   up, "
            "   created_at "
            "FROM "
            "   runs "
            "WHERE "
            "   id = ?",
            (id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        run = self.load(row)
        cursor.close()
        return run

    async def save(self, run: Run) -> None:
        cursor = self._conn.cursor()
        cursor.execute(
            "INSERT INTO runs("
            "   id, "
            "   name, "
            "   state_id, "
            "   function_id, "
            "   n_dims, "
            "   n_agents, "
            "   max_steps, "
            "   low, "
            "   up, "
            "   created_at "
            ") "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT (id) DO UPDATE SET "
            "   name = excluded.name, "
            "   state_id = excluded.state_id, "
            "   function_id = excluded.function_id, "
            "   n_dims = excluded.n_dims, "
            "   n_agents = excluded.n_agents, "
            "   max_steps = excluded.max_steps, "
            "   low = excluded.low, "
            "   up = excluded.up ",
            self.dump(run),
        )
        cursor.close()

    async def delete(self, id: str) -> None:
        cursor = self._conn.cursor()
        cursor.execute("DELETE FROM runs WHERE id = ?", (id,))
        cursor.close()


class SqliteStateRepository(StateRepository):
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    @staticmethod
    def load(row: Any) -> State:
        return State(
            id=row[0],
            run_id=row[1],
            step=row[2],
            visit_table=as_int_matrix(row[3]),
            agents=as_float_matrix(row[4]),
            fitness=as_float_list(row[5]),
            created_at=row[6],
        )

    @staticmethod
    def dump(state: State):
        return (
            state.id,
            state.run_id,
            state.step,
            str(state.visit_table),
            str(state.agents),
            str(state.fitness),
            state.created_at,
        )

    async def all(self, run_id: str) -> list[State]:
        cursor = self._conn.cursor()
        cursor.execute(
            "SELECT "
            "   id, "
            "   run_id, "
            "   step, "
            "   visit_table, "
            "   agents, "
            "   fitness, "
            "   created_at "
            "FROM "
            "   states "
            "WHERE "
            "   run_id = ?",
            (run_id,),
        )
        states = [self.load(row) for row in cursor.fetchall()]
        cursor.close()
        return states

    async def get(self, id: str) -> State | None:
        cursor = self._conn.cursor()
        cursor.execute(
            "SELECT "
            "   id, "
            "   run_id, "
            "   step, "
            "   visit_table, "
            "   agents, "
            "   fitness, "
            "   created_at "
            "FROM "
            "   states "
            "WHERE "
            "   id = ?",
            (id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        state = self.load(row)
        cursor.close()
        return state

    async def save(self, state: State) -> None:
        cursor = self._conn.cursor()
        cursor.execute(
            "INSERT INTO states("
            "   id, "
            "   run_id, "
            "   step, "
            "   visit_table, "
            "   agents, "
            "   fitness, "
            "   created_at "
            ") "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            self.dump(state),
        )
        cursor.close()


class SqliteStorage(Storage):
    def __init__(self, db: str):
        self.db = db
        self._conn: sqlite3.Connection | None = None

    @staticmethod
    def create(db: str) -> "SqliteStorage":
        pathlib.Path(db).parent.mkdir(parents=True, exist_ok=True)
        storage = SqliteStorage(db)
        connection = sqlite3.connect(db)
        connection.execute("PRAGMA foreign_keys = ON")
        cursor = connection.cursor()
        cursor.execute(
            "CREATE TABLE runs("
            "   id              TEXT PRIMARY KEY, "
            "   name            TEXT NOT NULL, "
            "   state_id        TEXT, "
            "   function_id     TEXT NOT NULL, "
            "   n_agents        INTEGER NOT NULL, "
            "   n_dims          INTEGER NOT NULL, "
            "   max_steps       INTEGER NOT NULL, "
            "   low             TEXT NOT NULL, "
            "   up              TEXT NOT NULL, "
            "   created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "
            "   FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL"
            ")"
        )
        cursor.execute(
            "CREATE TABLE states("
            "   id              TEXT PRIMARY KEY, "
            "   run_id          TEXT NOT NULL, "
            "   step            INTEGER NOT NULL, "
            "   visit_table     TEXT NOT NULL, "
            "   agents          TEXT NOT NULL, "
            "   fitness         TEXT NOT NULL, "
            "   created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "
            "   FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE, "
            "   UNIQUE(run_id, step)"
            ")"
        )
        cursor.execute("CREATE INDEX idx_runs_created_at ON runs(created_at)")
        cursor.execute("CREATE INDEX idx_states_run_id_step ON states(run_id, step)")
        cursor.close()
        connection.commit()
        return storage

    async def __aenter__(self):
        self._conn = sqlite3.connect(self.db)
        self._conn.execute("PRAGMA foreign_keys = ON")
        self.runs = SqliteRunRepository(self._conn)
        self.states = SqliteStateRepository(self._conn)
        self.functions = StaticFunctionRepository()
        return self

    async def __aexit__(self, exc_type: Any, exc: Any, traceback: Any):
        try:
            if exc:
                await self.rollback()
            else:
                await self.commit()
        finally:
            if self._conn:
                self._conn.close()

    async def commit(self) -> None:
        if self._conn:
            self._conn.commit()

    async def rollback(self) -> None:
        if self._conn:
            self._conn.rollback()
