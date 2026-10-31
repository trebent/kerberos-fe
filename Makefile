.PHONY: codegen lint build test

install:
	npm ci

install/cli:
	npm install -g @angular/cli

codegen:
	npx @openapitools/openapi-generator-cli generate -g typescript-angular -i openapi/admin.yaml -o src/app/api/admin --additional-properties=ngVersion=21,supportsES6=true,fileNaming=kebab-case
	npx @openapitools/openapi-generator-cli generate -g typescript-angular -i openapi/auth_basic.yaml -o src/app/api/auth-basic --additional-properties=ngVersion=21,supportsES6=true,fileNaming=kebab-case

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
