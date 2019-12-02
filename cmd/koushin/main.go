package main

import (
	"fmt"
	"os"

	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("usage: koushin imaps://<host>:<port>")
		return
	}

	url := os.Args[1]

	e := koushin.New(url)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Logger.Fatal(e.Start(":1323"))
}
