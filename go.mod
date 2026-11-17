module github.com/migadu/alps

go 1.26.0

toolchain go1.26.5

require (
	github.com/BurntSushi/toml v1.6.0
	github.com/aws/aws-sdk-go-v2 v1.48.0
	github.com/aws/aws-sdk-go-v2/config v1.33.19
	github.com/aws/aws-sdk-go-v2/credentials v1.21.1
	github.com/aws/aws-sdk-go-v2/service/s3 v1.114.10
	github.com/dustin/go-humanize v1.1.0
	github.com/emersion/go-ical v0.0.0-20261112170022-46c5b53a1723
	github.com/emersion/go-maildir v0.6.0
	github.com/emersion/go-message v0.18.2
	github.com/emersion/go-sasl v0.0.0-20241020182733-b788ff22d5a6
	github.com/emersion/go-smtp v0.24.0
	github.com/emersion/go-vcard v0.1.0
	github.com/fernet/fernet-go v0.0.0-20240119011108-303da6aec611
	github.com/go-webauthn/webauthn v0.18.2
	github.com/google/uuid v1.6.0
	github.com/hashicorp/memberlist v0.7.0
	github.com/migadu/go-imap v1.2.10
	github.com/migadu/go-webdav v1.0.0
	github.com/stretchr/testify v1.12.1
	golang.org/x/crypto v0.59.0
	golang.org/x/text v0.44.0
)

require (
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.7.27 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.20.9 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.5.12 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.8.12 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.5.12 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.13.25 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.11.13 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.14.12 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.20.12 // indirect
	github.com/aws/aws-sdk-go-v2/service/signin v1.13.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.39.5 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.44.5 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.52.0 // indirect
	github.com/aws/smithy-go v1.28.9 // indirect
	github.com/fxamacker/cbor/v2 v2.10.0 // indirect
	github.com/go-viper/mapstructure/v2 v2.5.0 // indirect
	github.com/go-webauthn/x v0.3.1 // indirect
	github.com/golang-jwt/jwt/v5 v5.3.1 // indirect
	github.com/google/btree v1.1.3 // indirect
	github.com/google/go-tpm v0.9.8 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-immutable-radix v1.3.1 // indirect
	github.com/hashicorp/go-metrics v0.7.0 // indirect
	github.com/hashicorp/go-msgpack/v2 v2.1.5 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/go-sockaddr v1.0.7
	github.com/hashicorp/golang-lru v1.0.2 // indirect
	github.com/miekg/dns v1.1.73 // indirect
	github.com/migadu/go-sieve v1.5.4
	github.com/philhofer/fwd v1.2.1 // indirect
	github.com/sean-/seed v0.0.0-20170313163322-e2103e2c3529 // indirect
	github.com/stretchr/objx v0.8.0 // indirect
	github.com/teambition/rrule-go v1.8.2
	github.com/tinylib/msgp v1.6.5 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	go.yaml.in/yaml/v3 v3.0.6 // indirect
	golang.org/x/net v0.62.0 // indirect
	golang.org/x/sys v0.50.0 // indirect
	rsc.io/binaryregexp v0.2.0 // indirect
)

replace github.com/emersion/go-smtp => github.com/migadu/go-smtp v0.24.0-migadu.2

replace github.com/emersion/go-message => github.com/migadu/go-message v0.19.0
