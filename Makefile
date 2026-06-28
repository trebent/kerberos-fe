.PHONY: codegen lint build test

install:
	npm install

codegen:
	npm run codegen-admin
	npm run codegen-auth-basic

lint:
	npm run lint

build:
	npm run build

test:
	npm run test -- --watch=false

run:
	npm run start
