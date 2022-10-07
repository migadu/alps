CMD_PACKAGE_DIR := git.sr.ht/~migadu/alps/cmd/alps

VERSION!=git describe --long --abbrev=12 --tags --dirty 2>/dev/null || echo 0.12.0
GO?=go
GOFLAGS?=
BUILD_OPTS?=-trimpath
flags!=echo -- $(GOFLAGS) | base64 | tr -d '\n'
# ignore environment variable
GO_LDFLAGS:=
GO_LDFLAGS+=-X main.Version=$(VERSION)
GO_LDFLAGS+=-X main.Flags=$(flags)
GO_LDFLAGS+=-X git.sr.ht/~migadu/alps/config.shareDir=$(SHAREDIR)
GO_LDFLAGS+=$(GO_EXTRA_LDFLAGS)

GOSRC!=find * -name '*.go'
GOSRC+=go.mod go.sum

all: alps $(DOCS)

build_cmd:=$(GO) build $(BUILD_OPTS) $(GOFLAGS) -ldflags "$(GO_LDFLAGS)" -o alps

.alps.d:
	@echo 'GOFLAGS have changed, recompiling'
	@echo '$(build_cmd)' > $@

alps: $(GOSRC) .alps.d
	$(build_cmd)

.PHONY: fmt
fmt:
	$(GO) run mvdan.cc/gofumpt -w .

.PHONY: lint
lint:
	@$(GO) run mvdan.cc/gofumpt -l . | grep ^ \
		&& echo The above files need to be formatted, please run make fmt && exit 1 \
		|| echo all files formatted.
	$(GO) run github.com/golangci/golangci-lint/cmd/golangci-lint run
	$(GO) run golang.org/x/vuln/cmd/govulncheck@latest ./...

.PHONY: tests
tests:
	$(GO) test $(GOFLAGS) -v ./...
