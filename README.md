# koushin

[![GoDoc](https://godoc.org/git.sr.ht/~emersion/koushin?status.svg)](https://godoc.org/git.sr.ht/~emersion/koushin)

A simple and extensible webmail.

## Usage

Assuming SRV DNS records are properly set up (see [RFC 6186]):

    go run ./cmd/koushin example.org

To manually specify upstream servers:

    go run ./cmd/koushin imaps://mail.example.org:993 smtps://mail.example.org:465

Add `-theme sourcehut` to use the SourceHut them. See `docs/cli.md` for more
information.

When developing themes and plugins, the script `contrib/hotreload.sh` can be
used to automatically reload koushin on file changes.

## Contributing

Send patches on the [mailing list], report bugs on the [issue tracker].

## License

MIT

[RFC 6186]: https://tools.ietf.org/html/rfc6186
[Go plugin helpers]: https://godoc.org/git.sr.ht/~emersion/koushin#GoPlugin
[mailing list]: https://lists.sr.ht/~sircmpwn/koushin
[issue tracker]: https://todo.sr.ht/~sircmpwn/koushin
