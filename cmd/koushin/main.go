package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	_ "git.sr.ht/~emersion/koushin/plugins/base"
	_ "git.sr.ht/~emersion/koushin/plugins/carddav"
	_ "git.sr.ht/~emersion/koushin/plugins/lua"
)

func main() {
	var options koushin.Options
	var addr string
	flag.StringVar(&options.Theme, "theme", "", "default theme")
	flag.StringVar(&addr, "addr", ":1323", "listening address")

	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "usage: koushin [options...] <upstream server...>\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	options.Upstreams = flag.Args()
	if len(options.Upstreams) == 0 {
		flag.Usage()
		return
	}

	e := echo.New()
	e.HideBanner = true
	if l, ok := e.Logger.(*log.Logger); ok {
		l.SetHeader("${time_rfc3339} ${level}")
	}
	s, err := koushin.New(e, &options)
	if err != nil {
		e.Logger.Fatal(err)
	}
	e.Use(middleware.Recover())

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGUSR1)
	go func() {
		for range sigs {
			if err := s.Reload(); err != nil {
				e.Logger.Errorf("Failed to reload server: %v", err)
			}
		}
	}()

	e.Logger.Fatal(e.Start(addr))
}
