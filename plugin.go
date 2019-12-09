package koushin

import (
	"fmt"
	"path/filepath"

	"github.com/labstack/echo/v4"
	"github.com/yuin/gopher-lua"
	"layeh.com/gopher-luar"
)

type Plugin interface {
	Name() string
	Render(name string, data interface{}) error
	Close() error
}

type luaPlugin struct {
	filename string
	state    *lua.LState
}

func (p *luaPlugin) Name() string {
	return p.filename
}

func (p *luaPlugin) Render(name string, data interface{}) error {
	global := p.state.GetGlobal("render")
	if global == nil {
		return nil
	}

	if err := p.state.CallByParam(lua.P{
		Fn:      global,
		NRet:    0,
		Protect: true,
	}, lua.LString(name), luar.New(p.state, data)); err != nil {
		return err
	}

	return nil
}

func (p *luaPlugin) Close() error {
	p.state.Close()
	return nil
}

func loadLuaPlugin(filename string) (*luaPlugin, error) {
	l := lua.NewState()
	if err := l.DoFile(filename); err != nil {
		return nil, err
	}

	return &luaPlugin{filename, l}, nil
}

func loadAllLuaPlugins(log echo.Logger) ([]Plugin, error) {
	filenames, err := filepath.Glob("plugins/*.lua")
	if err != nil {
		return nil, fmt.Errorf("filepath.Glob failed: %v", err)
	}

	plugins := make([]Plugin, 0, len(filenames))
	for _, filename := range filenames {
		log.Printf("Loading Lua plugin '%v'", filename)
		p, err := loadLuaPlugin(filename)
		if err != nil {
			for _, p := range plugins {
				p.Close()
			}
			return nil, fmt.Errorf("failed to load Lua plugin '%v': %v", filename, err)
		}
		plugins = append(plugins, p)
	}

	return plugins, nil
}
