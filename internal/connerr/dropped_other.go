//go:build !windows

package connerr

func platformDropped(error) bool { return false }
