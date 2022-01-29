CMD_PACKAGE_DIR := git.sr.ht/~migadu/alps/cmd/alps

## Build binaries on your environment
build:
	CGO_ENABLED=0 go build -ldflags "-X main.ConfigFile=/usr/local/etc/alps.conf -X main.ThemesPath=/usr/local/etc/alps/themes" "$(CMD_PACKAGE_DIR)"
