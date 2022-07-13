package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"git.sr.ht/~migadu/alps"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	"git.sr.ht/~migadu/alps/config"
	_ "git.sr.ht/~migadu/alps/plugins/base"
	_ "git.sr.ht/~migadu/alps/plugins/caldav"
	_ "git.sr.ht/~migadu/alps/plugins/carddav"
	_ "git.sr.ht/~migadu/alps/plugins/lua"
	_ "git.sr.ht/~migadu/alps/plugins/managesieve"
	_ "git.sr.ht/~migadu/alps/plugins/viewhtml"
	_ "git.sr.ht/~migadu/alps/plugins/viewtext"
)

var (
	ConfigFile = "./config/alps.conf"
	ThemesPath = "./themes"
)

func main() {
	config, err := config.LoadConfig(ConfigFile, ThemesPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load config: %v\n", err)
		os.Exit(1)
	}

	e := echo.New()
	e.HideBanner = true
	if l, ok := e.Logger.(*log.Logger); ok {
		l.SetHeader("${time_rfc3339} ${level}")
	}
	s, err := alps.New(e, config)
	if err != nil {
		e.Logger.Fatal(err)
	}
	e.Use(middleware.Recover())
	if config.Log.Debug {
		e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
			Format: "${time_rfc3339} method=${method}, uri=${uri}, status=${status}\n",
		}))
		e.Logger.SetLevel(log.DEBUG)
	}

	go e.Start(config.Server.Address)

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
