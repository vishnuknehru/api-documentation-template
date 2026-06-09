.PHONY: dev build up down generate-sdks install clean

# Start development servers
dev:
	@echo "Starting development servers..."
	@cd frontend && npm run dev &
	@cd sandbox && npm run dev

# Build Docker images
build:
	docker compose build

# Start all services with Docker
up:
	docker compose up

# Start in background
up-d:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Generate SDKs from OpenAPI specs (requires Docker)
generate-sdks:
	@echo "Generating SDKs for all APIs..."
	@bash scripts/generate-sdks.sh

# Install all dependencies
install:
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "Installing sandbox dependencies..."
	@cd sandbox && npm install

# Clean generated files and node_modules
clean:
	@rm -rf frontend/node_modules sandbox/node_modules
	@rm -rf frontend/.next
	@rm -rf frontend/public/sdks
	@echo "Cleaned."
