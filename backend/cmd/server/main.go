package main

import (
	"log/slog"
	"os"

	"github.com/vasugupta1/RSSFeed/backend/internal/client"
	"github.com/vasugupta1/RSSFeed/backend/internal/config"
	"github.com/vasugupta1/RSSFeed/backend/internal/handler"
	"github.com/vasugupta1/RSSFeed/backend/internal/server"
	"github.com/vasugupta1/RSSFeed/backend/internal/service"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))

	cfg := config.Load()

	// Initialize clients
	crawlerClient := client.NewCrawlerClient(cfg.CrawlerApiUrl)

	// Initialize services
	crawlerService := service.NewCrawlerService(crawlerClient)

	// Initialize handlers
	crawlerHandler := handler.NewCrawlerHandler(crawlerService)
	feedHandler := handler.NewFeedHandler()

	// Start the server
	app := &server.Application{
		Config:         cfg,
		CrawlerHandler: crawlerHandler,
		FeedHandler:    feedHandler,
	}

	if err := app.Run(); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
