package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func (app *Application) registerRoutes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	r.Get("/api/healthcheck", app.HealthHandler.HandleHealthCheck)
	r.Post("/api/crawler", app.CrawlerHandler.HandleCrawl)
	r.Post("/api/feed", app.FeedHandler.UpsertFeedUrl)
	r.Get("/api/articles", app.GetAllArticlesHandler.GetAllArticles)
	r.Delete("/api/article", app.DeleteArticleHandler.DeleteArticle)
	r.Post("/api/sync", app.SyncFeedHandler.SyncFeed)

	return r
}
