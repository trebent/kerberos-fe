.PHONY: codegen lint build test

install:
	npm ci

install/cli:
	npm install -g @angular/cli

codegen:
	npm run codegen-admin
	npm run codegen-auth-basic

format:
	npx prettier --write .

format/check:
	npx prettier --check .

lint:
	ng lint --fix

lint/ci:
	ng lint

build/dev:
	ng build --configuration development

build/prod:
	ng build

test:
	ng test --watch false

serve:
	ng serve

serve/staging:
	test/certs/make_certs.sh

	ng serve --configuration staging
