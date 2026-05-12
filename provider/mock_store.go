package provider

import (
	"github.com/stretchr/testify/mock"
)

// MockStore is a mock implementation of the Store interface.
type MockStore struct {
	mock.Mock
}

func (m *MockStore) Get(key string, out interface{}) error {
	args := m.Called(key, out)
	return args.Error(0)
}

func (m *MockStore) Put(key string, v interface{}) error {
	args := m.Called(key, v)
	return args.Error(0)
}
