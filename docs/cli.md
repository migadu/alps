# SYNOPSIS

    alps -config <path-to-config.toml>

# DESCRIPTION

alps is a simple and extensible webmail. It offers a web interface for IMAP,
SMTP and other upstream servers.

All configuration is provided via a TOML configuration file. A comprehensive example
can be found in `config.example.toml`.

# OPTIONS

**-config**: path to TOML configuration file (required)

**-h**, **--help**: show help message and exit

# LOGIN-KEY

A login key can be used to preserve user sessions over application restarts if
the user has selected 'remember me' on the login page. A key can be generated 
by running `go run github.com/fernet/fernet-go/cmd/fernet-keygen`
