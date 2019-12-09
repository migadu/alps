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
	filename        string
	state           *lua.LState
	renderCallbacks map[string]*lua.LFunction
}

func (p *luaPlugin) Name() string {
	return p.filename
}

func (p *luaPlugin) onRender(l *lua.LState) int {
	name := l.CheckString(1)
	f := l.CheckFunction(2)
	p.renderCallbacks[name] = f
	return 0
}

func (p *luaPlugin) Render(name string, data interface{}) error {
	f, ok := p.renderCallbacks[name]
	if !ok {
		return nil
	}

	if err := p.state.CallByParam(lua.P{
		Fn:      f,
		NRet:    0,
		Protect: true,
	}, luar.New(p.state, data)); err != nil {
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
	p := &luaPlugin{
		filename:        filename,
		state:           l,
		renderCallbacks: make(map[string]*lua.LFunction),
	}

	mt := l.NewTypeMetatable("koushin")
	l.SetGlobal("koushin", mt)
	l.SetField(mt, "on_render", l.NewFunction(p.onRender))
	// TODO: set_filter

	if err := l.DoFile(filename); err != nil {
		l.Close()
		return nil, err
	}

	return p, nil
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
