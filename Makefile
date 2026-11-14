default: check

install:
	npm ci

install/cli:
	npm install -g @angular/cli

codegen:
	npx @openapitools/openapi-generator-cli generate -g typescript-angular -i openapi/admin.yaml -o src/app/services/admin && npx @openapitools/openapi-generator-cli generate -g typescript-angular -i openapi/auth_basic.yaml -o src/app/services/auth-basic

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

# The checks CI runs on a pull request, in one go. CI also regenerates the API clients and
# fails if they differ from the committed ones.
check: format/check lint/ci build/prod test

.PHONY: default install install/cli codegen format format/check lint lint/ci build/dev build/prod test serve serve/staging check
