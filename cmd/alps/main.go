package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"git.sr.ht/~migadu/alps"
	"github.com/fernet/fernet-go"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	_ "git.sr.ht/~migadu/alps/plugins/base"
	_ "git.sr.ht/~migadu/alps/plugins/caldav"
	_ "git.sr.ht/~migadu/alps/plugins/carddav"
	_ "git.sr.ht/~migadu/alps/plugins/lua"
	_ "git.sr.ht/~migadu/alps/plugins/managesieve"
	_ "git.sr.ht/~migadu/alps/plugins/viewhtml"
	_ "git.sr.ht/~migadu/alps/plugins/viewtext"
)

var themesPath = "./themes"

func main() {
	var (
		addr     string
		loginKey string
		options  alps.Options
	)
	flag.StringVar(&options.Theme, "theme", "", "default theme")
	flag.StringVar(&addr, "addr", ":1323", "listening address")
	flag.BoolVar(&options.Debug, "debug", false, "enable debug logs")
	flag.StringVar(&loginKey, "login-key", "", "Fernet key for login persistence")

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
	options.ThemesPath = themesPath

	if loginKey != "" {
		fernetKey, err := fernet.DecodeKey(loginKey)
		if err != nil {
			flag.Usage()
			return
		}
		options.LoginKey = fernetKey
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
		e.Logger.SetLevel(log.DEBUG)
	}

	go e.Start(addr)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGUSR1, syscall.SIGINT)

	for sig := range sigs {
		if sig == syscall.SIGUSR1 {
			if err := s.Reload(); err != nil {
				e.Logger.Errorf("Failed to reload server: %v", err)
			}
		} else if sig == syscall.SIGINT {
			break
		}
	}

	ctx, cancel := context.WithDeadline(context.Background(),
		time.Now().Add(30*time.Second))
	e.Shutdown(ctx)
	cancel()

	s.Close()
}
