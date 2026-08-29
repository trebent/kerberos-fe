.PHONY: codegen lint build test

install:
	npm install

codegen:
	npm run codegen-admin
	npm run codegen-auth-basic

lint:
	npm run lint

build/dev:
	npm run build-dev

build/prod:
	npm run build-prod

test:
	npm run test -- --watch=false

run:
	npm run start

run/staging:
	test/certs/make_certs.sh

	npm run start-staging
