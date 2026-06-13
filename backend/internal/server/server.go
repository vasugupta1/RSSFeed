package server

import (
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/config"
	"github.com/vasugupta1/RSSFeed/backend/internal/handler"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository"
)

type Application struct {
	Config            config.APIConfiguration
	CrawlerHandler    *handler.CrawlerHandler
	FeedHandler       *handler.FeedHandler
	RepositoryService *repository.RepositoryService
}

func (app *Application) Run() error {
	r := app.registerRoutes()
	slog.Info("Starting server", "port", app.Config.Port)
	return http.ListenAndServe(":"+app.Config.Port, r)
}
