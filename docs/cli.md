# SYNOPSIS

    alps [options...] <upstream servers...>

# DESCRIPTION

alps is a simple and extensible webmail. It offers a web interface for IMAP,
SMTP and other upstream servers.

At least one upstream IMAP server needs to be specified. The easiest way to do
so is to just specify a domain name:

    alps example.org

This assumes SRV DNS records are properly set up (see [RFC 6186]).

Alternatively, one or more upstream server URLs can be specified:

    alps imaps://mail.example.org:993 smtps://mail.example.org:465

The following URL schemes are supported:

* `imaps` (IMAP with TLS), `imap+insecure` (plain IMAP)
* `smtps` (SMTP with TLS), `smtp+insecure` (plain SMTP)
* `https` (CardDAV and CalDAV over HTTPS), `http+insecure` (CardDAV and CalDAV
  over plain HTTP)
* `carddavs` (CardDAV over HTTPS), `carddav+insecure` (CardDAV over plain HTTP)
* `caldavs` (CalDAV over HTTPS), `caldav+insecure` (CalDAV over plain HTTP)
* `sieve` (ManageSieve with STARTTLS)

# OPTIONS

**-theme**: default theme (default: no theme)

**-addr**: listening address (default: ":1323")

**-debug**: enable debug logs and print IMAP network activity

**-login-key**: supply a secret key to preserve logins over application restart.

**-h**, **--help**: show help message and exit

# SIGNALS

**SIGUSR1**: reloads templates and Lua plugins

# LOGIN-KEY

A login key can be used to preserve user sessions over application restarts if
the user has selected 'remember me' on the login page. A key can be generated 
by running `go run github.com/fernet/fernet-go/cmd/fernet-keygen`

[RFC 6186]: https://tools.ietf.org/html/rfc6186
