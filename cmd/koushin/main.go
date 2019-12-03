package main

import (
	"fmt"
	"os"

	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	if len(os.Args) != 2 && len(os.Args) != 3 {
		fmt.Println("usage: koushin <IMAP URL> [SMTP URL]")
		return
	}

	imapURL := os.Args[1]

	var smtpURL string
	if len(os.Args) == 3 {
		smtpURL = os.Args[2]
	}

	e := koushin.New(imapURL, smtpURL)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Logger.Fatal(e.Start(":1323"))
}
