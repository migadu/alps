package storage

import (
	"context"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// MockS3Client implements the S3 operations needed for testing
// It uses an in-memory map to store data
type MockS3Client struct {
	Storage map[string][]byte
	GetErr  error
	PutErr  error
	DelErr  error
}

// NewMockS3Client creates a new mock S3 client with empty storage
func NewMockS3Client() *MockS3Client {
	return &MockS3Client{
		Storage: make(map[string][]byte),
	}
}

func (m *MockS3Client) GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	if m.GetErr != nil {
		return nil, m.GetErr
	}

	key := aws.ToString(params.Key)
	data, ok := m.Storage[key]
	if !ok {
		return nil, &types.NoSuchKey{
			Message: aws.String("key not found"),
		}
	}

	return &s3.GetObjectOutput{
		Body: &mockReadCloser{data: data},
	}, nil
}

func (m *MockS3Client) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	if m.PutErr != nil {
		return nil, m.PutErr
	}

	key := aws.ToString(params.Key)

	// Read data from Body
	data := make([]byte, 0)
	buf := make([]byte, 1024)
	for {
		n, err := params.Body.Read(buf)
		if n > 0 {
			data = append(data, buf[:n]...)
		}
		if err != nil {
			break
		}
	}

	m.Storage[key] = data
	return &s3.PutObjectOutput{}, nil
}

func (m *MockS3Client) DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	if m.DelErr != nil {
		return nil, m.DelErr
	}

	key := aws.ToString(params.Key)
	delete(m.Storage, key)
	return &s3.DeleteObjectOutput{}, nil
}

// mockReadCloser implements io.ReadCloser for testing
type mockReadCloser struct {
	data []byte
	pos  int
}

func (m *mockReadCloser) Read(p []byte) (n int, err error) {
	if m.pos >= len(m.data) {
		return 0, io.EOF
	}
	n = copy(p, m.data[m.pos:])
	m.pos += n
	if m.pos >= len(m.data) {
		return n, io.EOF
	}
	return n, nil
}

func (m *mockReadCloser) Close() error {
	return nil
}
