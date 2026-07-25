package server

import (
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/config"
	"github.com/vasugupta1/RSSFeed/backend/internal/handler"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type Application struct {
	Config                config.APIConfiguration
	CrawlerHandler        *handler.CrawlerHandler
	FeedHandler           *handler.FeedHandler
	HealthHandler         *handler.HealthCheckHandler
	GetAllArticlesHandler *handler.GetAllArticlesHandler
	DeleteArticleHandler  *handler.DeleteArticleHandler
	SyncFeedHandler       *handler.SyncFeedHandler
	ArticleChannel        chan models.Articles
}

func (app *Application) Run() error {
	r := app.registerRoutes()
	slog.Info("Starting server", "port", app.Config.Port)
	return http.ListenAndServe(":"+app.Config.Port, r)
}
