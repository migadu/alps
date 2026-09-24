package unified

import (
	"fmt"
	"errors"
	"encoding/json"
)

type userConfig struct {
	Accounts []*backendConfig           `json:"accounts"`
	Unified []string                    `json:"unified"`
	Settings map[string]json.RawMessage `json:"settings"`
}

type backendConfig struct {

	// Display name for the account
	Name string                   `json:"name"`

	// Credentials for connecting to the back end
	Username string               `json:"username"`
	Password string               `json:"password"`

	Server string `json:"server"`
}

func (c *backendConfig) check() error {

	var errList []error
	if c.Name == "" {
		errList = append(errList, fmt.Errorf("missing name"))
	}
	if c.Username == "" {
		errList = append(errList, fmt.Errorf("missing username"))
	}
	if c.Password == "" {
		errList = append(errList, fmt.Errorf("missing password"))
	}
	if len(errList) > 0 {
		return errors.Join(errList...)
	}
	return nil
}

