# koushin

[![GoDoc](https://godoc.org/git.sr.ht/~emersion/koushin?status.svg)](https://godoc.org/git.sr.ht/~emersion/koushin)

A simple and extensible webmail.

## Usage

Assuming SRV DNS records are properly set up (see [RFC 6186]):

    go run ./cmd/koushin example.org

To manually specify upstream servers:

    go run ./cmd/koushin imaps://mail.example.org:993 smtps://mail.example.org:465

See `docs/cli.md` for more information.

## Themes

They should be put in `themes/<name>/`.

Templates in `themes/<name>/*.html` override default templates in plugins.
Assets in `themes/<name>/assets/*` are served by the HTTP server at
`/themes/<name>/assets/*`.

## Plugins

Plugins can be written in Go or in Lua and live in `plugins/<name>/`.

Plugins can provide their own templates in `plugins/<name>/public/*.html`.
Assets in `plugins/<name>/public/assets/*` are served by the HTTP server at
`/plugins/<name>/assets/*`.

### Go plugins

They can use the [Go plugin helpers] and need to be included at compile-time in
`cmd/koushin/main.go`.

### Lua plugins

The entry point is at `plugins/<name>/main.lua`.

API:

* `koushin.on_render(name, f)`: prior to rendering the template `name`, call
  `f` with the template data (the special name `*` matches all templates)
* `koushin.set_filter(name, f)`: set a template function
* `koushin.set_route(method, path, f)`: register a new HTTP route, `f` will be
  called with the HTTP context

## Hot reload

Lua plugins and templates can be reloaded by sending `SIGUSR1` to koushin.

    killall -USR1 koushin

## Contributing

Send patches on the [mailing list], report bugs on the [issue tracker].

## License

MIT

[RFC 6186]: https://tools.ietf.org/html/rfc6186
[Go plugin helpers]: https://godoc.org/git.sr.ht/~emersion/koushin#GoPlugin
[mailing list]: https://lists.sr.ht/~sircmpwn/koushin
[issue tracker]: https://todo.sr.ht/~sircmpwn/koushin
