.PHONY: all clean build build-frontend install build-freebsd build-linux help test test-coverage

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
	@echo "  test           - Run tests"
	@echo "  test-coverage  - Run tests and show coverage in HTML"

# Run tests and show coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out
