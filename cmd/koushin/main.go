package main

import (
	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := koushin.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Logger.Fatal(e.Start(":1323"))
}
