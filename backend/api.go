package main

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/vasugupta1/RSSFeed/backend/internal/crawler"
)

type APIConfiguration struct {
	Port          string
	CrawlerApiUrl string
}

type Application struct {
	config APIConfiguration
}

func (app *Application) mount(cs crawler.Service) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	r.Get("/api/healthcheck", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Post("/api/crawler", crawler.NewHandler(cs).CrawlerHandler)

	return r
}

func (app *Application) Run(cs crawler.Service) error {
	r := app.mount(cs)
	slog.Info("Starting server", "port", app.config.Port)
	return http.ListenAndServe(":"+app.config.Port, r)
}
