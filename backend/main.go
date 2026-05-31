package main

import (
	"log/slog"
	"os"

	"github.com/vasugupta1/RSSFeed/backend/internal/crawler"
	"github.com/vasugupta1/RSSFeed/backend/internal/crawlerapiclient"
)

func main() {
	app := Application{
		config: APIConfiguration{
			Port:          getEnv("PORT", "8080"),
			CrawlerApiUrl: getEnv("services__rssfeedai__https__0", "http://localhost:8081"),
		},
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	crawlerService := createCrawlerService(app.config.CrawlerApiUrl)
	if err := app.Run(crawlerService); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}

func createCrawlerService(url string) crawler.Service {
	crawlerApiClient := crawlerapiclient.NewCrawlerClient(url)
	crawlerService := crawler.NewService(crawlerApiClient)
	return crawlerService
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
