# [alps]

[![GoDoc](https://godoc.org/github.com/migadu/alps?status.svg)](https://godoc.org/github.com/migadu/alps)

A simple and extensible webmail.

## Usage

All configuration is provided via a TOML configuration file. A comprehensive example can be found in `config.example.toml`. Copy this file to `config.toml` and edit it to suit your needs.

Run the alps backend server:

    go run ./cmd/alps -config config.toml

See `docs/cli.md` for more information on the CLI options.

### Frontend Interface

The webmail interface is a single-page application that must be compiled:

    cd frontend
    npm install
    npm run build

For frontend development, use the Vite dev server:

    cd frontend
    npm run dev

## Contributing

Send patches via [GitHub Pull Requests], report bugs on the [issue tracker].

## License

MIT

[alps]: https://github.com/migadu/alps
[RFC 6186]: https://tools.ietf.org/html/rfc6186
[GitHub Pull Requests]: https://github.com/migadu/alps/pulls
[issue tracker]: https://github.com/migadu/alps/issues
