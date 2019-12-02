package koushin

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func New() *echo.Echo {
	e := echo.New()

	var err error
	e.Renderer, err = loadTemplates()
	if err != nil {
		e.Logger.Fatal("Failed to load templates:", err)
	}

	e.GET("/", func(c echo.Context) error {
		return c.Render(http.StatusOK, "index.html", nil)
	})

	e.Static("/assets", "public/assets")

	return e
}
