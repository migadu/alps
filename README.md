# [alps]

[![GoDoc](https://godoc.org/git.sr.ht/~emersion/alps?status.svg)](https://godoc.org/git.sr.ht/~emersion/alps)

A simple and extensible webmail.

## Usage

Assuming SRV DNS records are properly set up (see [RFC 6186]):

    go run ./cmd/alps example.org

To manually specify upstream servers:

    go run ./cmd/alps imaps://mail.example.org:993 smtps://mail.example.org:465

Add `-theme sourcehut` to use the SourceHut theme. See `docs/cli.md` for more
information.

When developing themes and plugins, the script `contrib/hotreload.sh` can be
used to automatically reload alps on file changes.

## Contributing

Send patches on the [mailing list], report bugs on the [issue tracker].

## License

MIT

[alps]: https://sr.ht/~emersion/alps
[RFC 6186]: https://tools.ietf.org/html/rfc6186
[Go plugin helpers]: https://godoc.org/git.sr.ht/~emersion/alps#GoPlugin
[mailing list]: https://lists.sr.ht/~emersion/alps-dev
[issue tracker]: https://todo.sr.ht/~emersion/alps
