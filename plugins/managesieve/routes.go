package alpsmanagesieve

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~migadu/alps"
	"github.com/labstack/echo/v4"
	"go.guido-berhoerster.org/managesieve"
)

type ListFiltersRenderData struct {
	alps.BaseRenderData
	Scripts []string
	Active  string
}

type FilterRenderData struct {
	alps.BaseRenderData
	Name     string
	Content  string
	IsActive bool
}

type UpdateFilterRenderData struct {
	alps.BaseRenderData
	Name         string
	Content      string
	SupportCheck bool
}

type RenameFilterRenderData struct {
	alps.BaseRenderData
	OldName string
	NewName string
}

func appendWarnings(notice, warnings string) string {
	if warnings != "" {
		notice += fmt.Sprintf(" with warnings: %v", warnings)
	} else {
		notice += "."
	}

	return notice
}

func registerRoutes(p *plugin) {
	p.GET("/filters", func(ctx *alps.Context) error {
		c, err := p.connect(ctx.Session)
		if err != nil {
			return err
		}
		defer c.Logout()

		scripts, active, err := c.ListScripts()
		if err != nil {
			return fmt.Errorf("LISTSCRIPTS failed: %v", err)
		}

		return ctx.Render(http.StatusOK, "list-filters.html", &ListFiltersRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			Scripts:        scripts,
			Active:         active,
		})

	})

	p.GET("/filters/:name", func(ctx *alps.Context) error {
		c, err := p.connect(ctx.Session)
		if err != nil {
			return err
		}
		defer c.Logout()

		name := ctx.Param("name")

		_, active, err := c.ListScripts()
		if err != nil {
			return fmt.Errorf("LISTSCRIPTS failed: %v", err)
		}

		content, err := c.GetScript(name)
		if err != nil {
			return fmt.Errorf("GETSCRIPT failed: %v", err)
		}

		return ctx.Render(http.StatusOK, "filter.html", &FilterRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			Name:           name,
			Content:        content,
			IsActive:       name == active,
		})

	})

	updateFilter := func(ctx *alps.Context) error {
		c, err := p.connect(ctx.Session)
		if err != nil {
			return err
		}
		defer c.Logout()

		supportCheck := c.SupportsRFC5804()
		name := ctx.Param("name")
		create := name == ""

		if ctx.Request().Method == "POST" {
			if create {
				name = ctx.FormValue("name")
			}
			content := ctx.FormValue("content")

			render := func(notice string) error {
				ctx.Session.PutNotice(notice)
				return ctx.Render(http.StatusOK, "update-filter.html", &UpdateFilterRenderData{
					BaseRenderData: *alps.NewBaseRenderData(ctx),
					Name:           name,
					Content:        content,
					SupportCheck:   supportCheck,
				})
			}

			if create {
				scripts, _, err := c.ListScripts()
				if err != nil {
					return fmt.Errorf("LISTSCRIPTS failed: %v", err)
				}

				for _, s := range scripts {
					if s == name {
						return render("Could not save filter: name already exists.")
					}
				}
			}

			formParams, err := ctx.FormParams()
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, err)
			}

			_, check := formParams["check"]
			if check {
				warnings, err := c.CheckScript(content)
				if err != nil {
					if _, ok := err.(*managesieve.ServerError); ok {
						return render(fmt.Sprintf("Check failed: %s", err))
					} else {
						return fmt.Errorf("CHECKSCRIPT failed: %v", err)
					}
				}
				notice := appendWarnings("Check passed", warnings)
				return render(notice)
			}

			warnings, err := c.PutScript(name, content)
			if err != nil {
				if _, ok := err.(*managesieve.ServerError); ok {
					return render(fmt.Sprintf("Could not save filter: %s", err))
				} else {
					return fmt.Errorf("PUTSCRIPT failed: %v", err)
				}
			}

			notice := appendWarnings("Filter saved", warnings)
			ctx.Session.PutNotice(notice)

			return ctx.Redirect(http.StatusFound, fmt.Sprintf("/filters/%s", url.PathEscape(name)))
		}

		var content string
		if !create {
			content, err = c.GetScript(name)
			if err != nil {
				return fmt.Errorf("GETSCRIPT failed: %v", err)
			}
		}

		return ctx.Render(http.StatusOK, "update-filter.html", &UpdateFilterRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			Name:           name,
			Content:        content,
			SupportCheck:   supportCheck,
		})
	}

	p.GET("/filters/create", updateFilter)
	p.POST("/filters/create", updateFilter)

	p.GET("/filters/:name/edit", updateFilter)
	p.POST("/filters/:name/edit", updateFilter)

	renameFilter := func(ctx *alps.Context) error {
		c, err := p.connect(ctx.Session)
		if err != nil {
			return err
		}
		defer c.Logout()

		oldName := ctx.Param("name")

		if ctx.Request().Method == "POST" {
			newName := ctx.FormValue("new-name")

			err := c.RenameScript(oldName, newName)
			if err != nil {
				if _, ok := err.(*managesieve.ServerError); ok {
					ctx.Session.PutNotice(fmt.Sprintf("Could not rename filter: %s", err))
					return ctx.Render(http.StatusOK, "rename-filter.html", &RenameFilterRenderData{
						BaseRenderData: *alps.NewBaseRenderData(ctx),
						OldName:        oldName,
						NewName:        newName,
					})
				} else {
					return fmt.Errorf("RENAMESCRIPT failed: %v", err)
				}
			}

			ctx.Session.PutNotice("Filter renamed.")
			return ctx.Redirect(http.StatusFound, fmt.Sprintf("/filters/%s", url.PathEscape(newName)))
		}

		return ctx.Render(http.StatusOK, "rename-filter.html", &RenameFilterRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			OldName:        oldName,
		})
	}

	p.GET("/filters/:name/rename", renameFilter)
	p.POST("/filters/:name/rename", renameFilter)

	p.POST("/filters/activate", func(ctx *alps.Context) error {
		c, err := p.connect(ctx.Session)
		if err != nil {
			return err
		}
		defer c.Logout()

		fmt.Println(ctx.FormParams())

		name := ctx.FormValue("name")
		source := ctx.FormValue("source")

		if err := c.ActivateScript(name); err != nil {
			return fmt.Errorf("SETACTIVE failed: %v", err)
		}

		var notice string
		if name != "" {
			notice = "Filter activated."
		} else {
			notice = "Any active filter disabled."
		}

		var redirectURL string
		if source != "" {
			redirectURL = fmt.Sprintf("/filters/%s", url.PathEscape(source))
		} else {
			redirectURL = "/filters"
		}

		ctx.Session.PutNotice(notice)
		return ctx.Redirect(http.StatusFound, redirectURL)
	})

	p.POST("/filters/delete", func(ctx *alps.Context) error {
		c, err := p.connect(ctx.Session)
		if err != nil {
			return err
		}
		defer c.Logout()

		formParams, err := ctx.FormParams()
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		names := formParams["names"]

		if len(names) == 0 {
			ctx.Session.PutNotice("Could not delete: no filters selected.")
			return ctx.Redirect(http.StatusFound, "/filters")
		}

		_, active, err := c.ListScripts()
		if err != nil {
			return fmt.Errorf("LISTSCRIPTS failed: %v", err)
		}

		for _, name := range names {
			if active == name {
				if err := c.ActivateScript(""); err != nil {
					return fmt.Errorf("SETACTIVE failed: %v", err)
				}
			}

			if err := c.DeleteScript(name); err != nil {
				return fmt.Errorf("DELETESCRIPT failed: %v", err)
			}
		}

		ctx.Session.PutNotice("Filter(s) deleted.")
		return ctx.Redirect(http.StatusFound, "/filters")
	})
}
