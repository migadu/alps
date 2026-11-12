.PHONY: all clean build build-frontend install build-freebsd build-linux help test test-coverage test-frontend test-e2e test-all

# Binary names
ALPS_BINARY ?= build/alps
ALPS_FREEBSD_BINARY ?= build/alps-freebsd-amd64
ALPS_LINUX_BINARY ?= build/alps-linux-amd64

# Version information
VERSION ?= $(shell git describe --tags --always --dirty --match='v*' 2>/dev/null || echo "dev")
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Go linker flags
LDFLAGS_VARS = -X 'main.version=${VERSION}' -X 'main.commit=${COMMIT}' -X 'main.date=${DATE}'
LDFLAGS = -ldflags="${LDFLAGS_VARS}"

# Default target
all: build

# Build the frontend
build-frontend:
	cd frontend && npm install && npm run build

# Build the alps binary
build:
	go build $(LDFLAGS) -o $(ALPS_BINARY) ./cmd/alps

# Install to GOPATH/bin
install:
	go install $(LDFLAGS) ./cmd/alps

# Cross-compile for FreeBSD
build-freebsd:
	CGO_ENABLED=0 GOARCH=amd64 GOOS=freebsd go build $(LDFLAGS) -o $(ALPS_FREEBSD_BINARY) ./cmd/alps

# Cross-compile for Linux
build-linux:
	CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build $(LDFLAGS) -o $(ALPS_LINUX_BINARY) ./cmd/alps

# Clean build artifacts
clean:
	rm -rf build/

# Run tests
test:
	go test -v ./...

# Install the frontend's dependencies from the lockfile, when they are missing
frontend/node_modules:
	cd frontend && npm ci

# Run the frontend unit tests: typecheck the tests, then Vitest (see docs/E2E.md)
test-frontend: frontend/node_modules
	cd frontend && npm test

# Run the browser tests against a local mail stack (see docs/E2E.md).
# E2E_ARGS goes to Playwright, e.g. make test-e2e E2E_ARGS=e2e/reading.spec.ts
test-e2e: frontend/node_modules
	scripts/e2e.sh $(E2E_ARGS)

# Run all three suites: Go, frontend unit and browser tests
test-all: test test-frontend test-e2e

# Help
help:
	@echo "Available targets:"
	@echo "  all            - Build alps (default)"
	@echo "  build-frontend - Build frontend assets"
	@echo "  build          - Build alps binary"
	@echo "  install        - Install to GOPATH/bin"
	@echo "  build-freebsd  - Cross-compile for FreeBSD amd64"
	@echo "  build-linux    - Cross-compile for Linux amd64"
	@echo "  clean          - Remove build artifacts"
	@echo "  test           - Run the Go tests"
	@echo "  test-frontend  - Run the frontend unit tests (typecheck, then Vitest)"
	@echo "  test-e2e       - Run the browser tests (needs a sora checkout and PostgreSQL)"
	@echo "  test-all       - Run the Go, frontend unit and browser tests"
	@echo "  test-coverage  - Run tests and show coverage in HTML"

# Run tests and show coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out
