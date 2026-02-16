lint:
	cd "./nazarov/server" && make lint

format:
	cd "./nazarov/server" && make format
	cd "./nazarov/client" && make format

test:
	cd "./nazarov/server" && make test
	cd "./nazarov/client" && make test

up:
	docker compose up --build
