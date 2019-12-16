# koushin

[![GoDoc](https://godoc.org/git.sr.ht/~emersion/koushin?status.svg)](https://godoc.org/git.sr.ht/~emersion/koushin)

## Usage

    go run ./cmd/koushin imaps://mail.example.org:993 smtps://mail.example.org:465

See `-h` for more information.

## Themes

They should be put in `public/themes/<name>/`.

Templates in `public/themes/<name>/*.html` override default templates in
`public/*.html`. Assets in `public/themes/<name>/assets/*` are served by the
HTTP server at `/themes/<name>/assets/*`.

## Plugins

Lua plugins are supported. They can be dropped in `plugins/<name>/main.lua`.

API:

* `koushin.on_render(name, f)`: prior to rendering the template `name`, call
  `f` with the template data
* `koushin.set_filter(name, f)`: set a template function
* `koushin.set_route(method, path, f)`: register a new HTTP route, `f` will be
  called with the HTTP context

Plugins can provide their own templates in `plugins/<name>/public/*.html`.
Assets in `plugins/<name>/public/assets/*` are served by the HTTP server at
`/plugins/<name>/assets/*`.

## Contributing

Send patches [on the mailing list](https://lists.sr.ht/~sircmpwn/koushin),
report bugs [on the issue tracker](https://todo.sr.ht/~sircmpwn/koushin).

## License

MIT
