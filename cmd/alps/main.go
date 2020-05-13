package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"git.sr.ht/~emersion/alps"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	_ "git.sr.ht/~emersion/alps/plugins/base"
	_ "git.sr.ht/~emersion/alps/plugins/caldav"
	_ "git.sr.ht/~emersion/alps/plugins/carddav"
	_ "git.sr.ht/~emersion/alps/plugins/lua"
	_ "git.sr.ht/~emersion/alps/plugins/viewhtml"
	_ "git.sr.ht/~emersion/alps/plugins/viewtext"
)

func main() {
	var options alps.Options
	var addr string
	flag.StringVar(&options.Theme, "theme", "", "default theme")
	flag.StringVar(&addr, "addr", ":1323", "listening address")
	flag.BoolVar(&options.Debug, "debug", false, "enable debug logs")

	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "usage: alps [options...] <upstream servers...>\n")
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
	s, err := alps.New(e, &options)
	if err != nil {
		e.Logger.Fatal(err)
	}
	e.Use(middleware.Recover())
	if options.Debug {
		e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
			Format: "${time_rfc3339} method=${method}, uri=${uri}, status=${status}\n",
		}))
	}

	if options.Debug {
		e.Logger.SetLevel(log.DEBUG)
	}

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
