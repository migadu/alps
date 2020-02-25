package koushinviewhtml

import (
	"io"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4"
)

var (
	proxyEnabled = true
	proxyMaxSize = 5 * 1024 * 1024 // 5 MiB
)

func init() {
	p := koushin.GoPlugin{Name: "viewhtml"}

	p.GET("/proxy", func(ctx *koushin.Context) error {
		if !proxyEnabled {
			return echo.NewHTTPError(http.StatusForbidden, "proxy disabled")
		}

		u, err := url.Parse(ctx.QueryParam("src"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid URL")
		}

		if u.Scheme != "https" {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid scheme")
		}

		resp, err := http.Get(u.String())
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		mediaType, _, err := mime.ParseMediaType(resp.Header.Get("Content-Type"))
		if err != nil || !strings.HasPrefix(mediaType, "image/") {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid resource type")
		}

		size, err := strconv.Atoi(resp.Header.Get("Content-Length"))
		if err != nil || size > proxyMaxSize {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid resource length")
		}

		ctx.Response().Header().Set("Content-Length", strconv.Itoa(size))
		lr := io.LimitedReader{resp.Body, int64(proxyMaxSize)}
		return ctx.Stream(http.StatusOK, mediaType, &lr)
	})

	koushin.RegisterPluginLoader(p.Loader())
}
