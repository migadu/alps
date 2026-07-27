module github.com/migadu/alps

go 1.25.0

toolchain go1.26.5

require (
	github.com/BurntSushi/toml v1.5.0
	github.com/aws/aws-sdk-go-v2 v1.41.7
	github.com/aws/aws-sdk-go-v2/config v1.32.17
	github.com/aws/aws-sdk-go-v2/credentials v1.19.16
	github.com/aws/aws-sdk-go-v2/service/s3 v1.101.0
	github.com/dustin/go-humanize v1.0.1
	github.com/emersion/go-ical v0.0.0-20250609112844-439c63cef608
	github.com/emersion/go-imap/v2 v2.0.0-beta.8
	github.com/emersion/go-maildir v0.6.0
	github.com/emersion/go-message v0.18.2
	github.com/emersion/go-sasl v0.0.0-20241020182733-b788ff22d5a6
	github.com/emersion/go-smtp v0.24.0
	github.com/emersion/go-vcard v0.0.0-20241024213814-c9703dde27ff
	github.com/emersion/go-webdav v0.7.0
	github.com/fernet/fernet-go v0.0.0-20240119011108-303da6aec611
	github.com/go-webauthn/webauthn v0.17.2
	github.com/google/uuid v1.6.0
	github.com/hashicorp/memberlist v0.5.4
	github.com/stretchr/testify v1.11.1
	golang.org/x/crypto v0.53.0
	golang.org/x/text v0.39.0
)

require (
	github.com/armon/go-metrics v0.4.1 // indirect
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.7.10 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.18.23 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.4.23 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.7.23 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.4.24 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.13.9 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.9.15 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.13.23 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.19.23 // indirect
	github.com/aws/aws-sdk-go-v2/service/signin v1.0.11 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.30.17 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.35.21 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.42.1 // indirect
	github.com/aws/smithy-go v1.25.1 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/fxamacker/cbor/v2 v2.9.1 // indirect
	github.com/go-viper/mapstructure/v2 v2.5.0 // indirect
	github.com/go-webauthn/x v0.2.3 // indirect
	github.com/golang-jwt/jwt/v5 v5.3.1 // indirect
	github.com/google/btree v1.1.3 // indirect
	github.com/google/go-tpm v0.9.8 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-immutable-radix v1.0.0 // indirect
	github.com/hashicorp/go-metrics v0.5.4 // indirect
	github.com/hashicorp/go-msgpack/v2 v2.1.5 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/go-sockaddr v1.0.7 // indirect
	github.com/hashicorp/golang-lru v0.5.0 // indirect
	github.com/miekg/dns v1.1.68 // indirect
	github.com/migadu/go-sieve v1.1.2
	github.com/philhofer/fwd v1.2.0 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/sean-/seed v0.0.0-20170313163322-e2103e2c3529 // indirect
	github.com/stretchr/objx v0.5.2 // indirect
	github.com/teambition/rrule-go v1.8.2 // indirect
	github.com/tinylib/msgp v1.6.4 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	golang.org/x/mod v0.37.0 // indirect
	golang.org/x/net v0.56.0 // indirect
	golang.org/x/sync v0.21.0 // indirect
	golang.org/x/sys v0.46.0 // indirect
	golang.org/x/tools v0.47.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	rsc.io/binaryregexp v0.2.0 // indirect
)

replace github.com/emersion/go-imap/v2 => github.com/migadu/go-imap/v2 v2.0.0-20260705230833-16878ed2ebee

replace github.com/emersion/go-smtp => github.com/migadu/go-smtp v0.0.0-20260705231539-0ef684185ca4

replace github.com/emersion/go-message => github.com/migadu/go-message v0.0.0-20260705121217-8814c0e56d68
