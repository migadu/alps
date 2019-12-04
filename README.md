# koushin

## Usage

    go run ./cmd/koushin imaps://mail.example.org:993 smtps://mail.example.org:465

See `-h` for more information.

## Themes

They should be put in `public/themes/<name>/`.

Templates in `public/themes/<name>/*.html` override default templates in
`public/*.html`. Assets in `public/themes/<name>/assets/*` are served by the
HTTP server at `themes/<name>/assets/*`.

## License

MIT
