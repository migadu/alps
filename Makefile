CMD_PACKAGE_DIR := git.sr.ht/~migadu/alps/cmd/alps

## Build binaries on your environment
build:
	CGO_ENABLED=0 go build "$(CMD_PACKAGE_DIR)"
