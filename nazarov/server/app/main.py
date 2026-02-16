from app.adapters.sqlite import SqliteStorage
from app.api.asgi import ASGI
from app.config import Config
from app.core.server import Server


def main():
    config = Config()
    storage = SqliteStorage.create(config.sqlite.db)
    server = Server(storage)
    asgi = ASGI(server)
    asgi.listen_and_serve(config.host, config.port)


if __name__ == "__main__":
    main()
