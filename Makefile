.PHONY: codegen lint build test

install:
	npm ci

codegen:
	./node_modules/.bin/openapi-generator-cli generate \
		-g typescript-angular \
		-i openapi/admin.yaml \
		-o src/app/api/admin \
		--additional-properties=ngVersion=21,supportsES6=true,withInterfaces=true,apiModulePrefix=Admin,fileNaming=kebab-case
	./node_modules/.bin/openapi-generator-cli generate \
		-g typescript-angular \
		-i openapi/auth_basic.yaml \
		-o src/app/api/auth-basic \
		--additional-properties=ngVersion=21,supportsES6=true,withInterfaces=true,apiModulePrefix=AuthBasic,fileNaming=kebab-case

lint:
	npm run lint

build:
	npm run build

test:
	npm run test -- --watch=false
