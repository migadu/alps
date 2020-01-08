package main

import (
	"flag"
	"fmt"

	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	_ "git.sr.ht/~emersion/koushin/plugins/base"
)

func main() {
	var options koushin.Options
	flag.StringVar(&options.Theme, "theme", "", "default theme")

	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "usage: koushin [options...] <IMAP URL> [SMTP URL]\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	if flag.NArg() < 1 || flag.NArg() > 2 {
		flag.Usage()
		return
	}

	options.IMAPURL = flag.Arg(0)
	options.SMTPURL = flag.Arg(1)

	e := echo.New()
	if l, ok := e.Logger.(*log.Logger); ok {
		l.SetHeader("${time_rfc3339} ${level}")
	}
	_, err := koushin.New(e, &options)
	if err != nil {
		e.Logger.Fatal(err)
	}
	e.Use(middleware.Recover())
	e.Logger.Fatal(e.Start(":1323"))
}
