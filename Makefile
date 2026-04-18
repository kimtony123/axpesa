.PHONY: install dev backend web mobile build-apk db-migrate db-reset help

help:
	@echo "AxPesa Makefile Commands"
	@echo "========================"
	@echo "install      - Install all dependencies"
	@echo "dev         - Start all services (backend, web, mobile)"
	@echo "backend     - Start backend only"
	@echo "web         - Start Next.js web only"
	@echo "mobile      - Start Expo mobile only"
	@echo "build-apk   - Build Android APK"
	@echo "db-migrate  - Run database migrations"
	@echo "db-reset    - Reset database"
	@echo "db-studio   - Open Prisma Studio"

install:
	npm install
	cd apps/backend && npm install
	cd apps/web && npm install
	cd apps/mobile && npm install

dev:
	concurrently "npm run backend" "npm run web"

backend:
	cd apps/backend && npm run dev

web:
	cd apps/web && npm run dev

mobile:
	cd apps/mobile && npm start

db-migrate:
	cd apps/backend && npx prisma migrate dev

db-generate:
	cd apps/backend && npx prisma generate

db-push:
	cd apps/backend && npx prisma db push

db-studio:
	cd apps/backend && npx prisma studio

build-web:
	cd apps/web && npm run build

build-apk:
	cd apps/mobile && eas build -p android --profile preview

build-apk-local:
	cd apps/mobile/android && ./gradlew assembleDebug

db-reset:
	cd apps/backend && npx prisma migrate reset --force
