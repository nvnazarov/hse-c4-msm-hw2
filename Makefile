lint:
	cd "./nazarov/server" && make lint

format:
	cd "./nazarov/server" && make format

test:
	cd "./nazarov/server" && make test

up:
	docker compose up --build
