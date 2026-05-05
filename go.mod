module github.com/migadu/alps

go 1.25.0

require (
	github.com/BurntSushi/toml v1.5.0
	github.com/dustin/go-humanize v1.0.1
	github.com/emersion/go-imap/v2 v2.0.0-beta.8
	github.com/emersion/go-message v0.18.2
	github.com/emersion/go-sasl v0.0.0-20241020182733-b788ff22d5a6
	github.com/emersion/go-smtp v0.24.0
	github.com/fernet/fernet-go v0.0.0-20240119011108-303da6aec611
	github.com/go-webauthn/webauthn v0.17.2
	github.com/google/uuid v1.6.0
	github.com/minio/minio-go/v7 v7.0.95
	golang.org/x/crypto v0.50.0
	golang.org/x/text v0.36.0
)

replace github.com/emersion/go-imap/v2 => github.com/migadu/go-imap/v2 v2.0.0-20260316134619-b8676c927c75

require (
	github.com/fxamacker/cbor/v2 v2.9.1 // indirect
	github.com/go-ini/ini v1.67.0 // indirect
	github.com/go-viper/mapstructure/v2 v2.5.0 // indirect
	github.com/go-webauthn/x v0.2.3 // indirect
	github.com/goccy/go-json v0.10.5 // indirect
	github.com/golang-jwt/jwt/v5 v5.3.1 // indirect
	github.com/google/go-tpm v0.9.8 // indirect
	github.com/klauspost/compress v1.18.0 // indirect
	github.com/klauspost/cpuid/v2 v2.2.11 // indirect
	github.com/minio/crc64nvme v1.0.2 // indirect
	github.com/minio/md5-simd v1.1.2 // indirect
	github.com/philhofer/fwd v1.2.0 // indirect
	github.com/rs/xid v1.6.0 // indirect
	github.com/tinylib/msgp v1.6.4 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	golang.org/x/net v0.52.0 // indirect
	golang.org/x/sys v0.43.0 // indirect
)
