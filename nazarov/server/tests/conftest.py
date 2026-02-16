import pathlib

import httpx
import pytest
import pytest_asyncio
from asgi_lifespan import LifespanManager

from app.adapters.sqlite import SqliteStorage
from app.api.asgi import ASGI
from app.core.server import Server


@pytest.fixture
def storage(tmp_path: pathlib.Path):
    db = tmp_path / "test.db"
    storage = SqliteStorage.create(db.as_posix())
    return storage


@pytest.fixture
def server(storage: SqliteStorage):
    return Server(storage)


@pytest.fixture
def asgi(server: Server):
    return ASGI(server)


@pytest_asyncio.fixture
async def client(asgi: ASGI):
    transport = httpx.ASGITransport(asgi)
    async with LifespanManager(asgi):
        async with httpx.AsyncClient(
            transport=transport, base_url="http://test"
        ) as client:
            yield client
