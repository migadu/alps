#!/bin/sh
cd frontend && npm run build && cd ..
go run ./cmd/alps --config config.toml
