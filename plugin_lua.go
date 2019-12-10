package koushin

import (
	"fmt"
	"html/template"
	"path/filepath"

	"github.com/labstack/echo/v4"
	"github.com/yuin/gopher-lua"
	"layeh.com/gopher-luar"
)

type luaRoute struct {
	method string
	path string
	f *lua.LFunction
}

type luaPlugin struct {
	filename        string
	state           *lua.LState
	renderCallbacks map[string]*lua.LFunction
	filters         template.FuncMap
	routes          []luaRoute
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

func (p *luaPlugin) setFilter(l *lua.LState) int {
	name := l.CheckString(1)
	f := l.CheckFunction(2)
	p.filters[name] = func(args ...interface{}) string {
		luaArgs := make([]lua.LValue, len(args))
		for i, v := range args {
			luaArgs[i] = luar.New(l, v)
		}

		err := l.CallByParam(lua.P{
			Fn:      f,
			NRet:    1,
			Protect: true,
		}, luaArgs...)
		if err != nil {
			panic(err) // TODO: better error handling?
		}

		ret := l.CheckString(-1)
		l.Pop(1)
		return ret
	}
	return 0
}

func (p *luaPlugin) setRoute(l *lua.LState) int {
	method := l.CheckString(1)
	path := l.CheckString(2)
	f := l.CheckFunction(3)
	p.routes = append(p.routes, luaRoute{method, path, f})
	return 0
}

func (p *luaPlugin) Inject(name string, data interface{}) error {
	f, ok := p.renderCallbacks[name]
	if !ok {
		return nil
	}

	err := p.state.CallByParam(lua.P{
		Fn:      f,
		NRet:    0,
		Protect: true,
	}, luar.New(p.state, data))
	if err != nil {
		return err
	}

	return nil
}

func (p *luaPlugin) Filters() template.FuncMap {
	return p.filters
}

func (p *luaPlugin) SetRoutes(group *echo.Group) {
	for _, r := range p.routes {
		group.Match([]string{r.method}, r.path, func(ctx echo.Context) error {
			err := p.state.CallByParam(lua.P{
				Fn: r.f,
				NRet: 0,
				Protect: true,
			}, luar.New(p.state, ctx))
			if err != nil {
				return fmt.Errorf("Lua plugin error: %v", err)
			}

			return nil
		})
	}
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
		filters:         make(template.FuncMap),
	}

	mt := l.NewTypeMetatable("koushin")
	l.SetGlobal("koushin", mt)
	l.SetField(mt, "on_render", l.NewFunction(p.onRender))
	l.SetField(mt, "set_filter", l.NewFunction(p.setFilter))
	l.SetField(mt, "set_route", l.NewFunction(p.setRoute))

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
