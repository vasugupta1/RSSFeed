package main

import (
	"context"
	"log"
	"log/slog"
	"os"

	"github.com/vasugupta1/RSSFeed/backend/internal/background"
	"github.com/vasugupta1/RSSFeed/backend/internal/client"
	"github.com/vasugupta1/RSSFeed/backend/internal/config"
	"github.com/vasugupta1/RSSFeed/backend/internal/handler"
	crawlerModels "github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/server"
	"github.com/vasugupta1/RSSFeed/backend/internal/service"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))

	cfg := config.Load()

	databaseCgf := &models.RepositoryConfiguration{
		ConnectionString: cfg.CosmosConnectionString,
		CollectionNames:  cfg.CollectionNames,
		DatabaseName:     cfg.DatabaseName,
	}
	respositoryService, err := repository.NewMongoRepository(databaseCgf)
	if err != nil {
		slog.Error("Failed to connect to server server", "error", err)
		os.Exit(1)
	}

	defer func() {
		if err = respositoryService.Client.Disconnect(context.TODO()); err != nil {
			log.Fatal(err)
		}
	}()

	// Initialize clients
	crawlerClient := client.NewCrawlerClient(cfg.CrawlerApiUrl)

	// Initialize services
	pollyLimter := service.NewPolly[*crawlerModels.CrawlUrlResponse](5)
	crawlerService := service.NewCrawlerService(crawlerClient, pollyLimter)

	// Initialize Background service
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	articleChannel := make(chan models.Articles, 100)
	articleSaveBackGroundService := background.NewFetchArticleBackGroundService(articleChannel, crawlerService, respositoryService)
	go articleSaveBackGroundService.FetchArticleAndCache(ctx)

	// Initialize handlers
	crawlerHandler := handler.NewCrawlerHandler(crawlerService, respositoryService)
	feedHandler := handler.NewFeedHandler(respositoryService, articleChannel)
	healthHandler := handler.NewHealthCheckHandler()
	getAllArticlesHandler := handler.NewGetAllArticlesHandler(respositoryService)

	// Start the server
	app := &server.Application{
		Config:                cfg,
		CrawlerHandler:        crawlerHandler,
		FeedHandler:           feedHandler,
		HealthHandler:         healthHandler,
		GetAllArticlesHandler: getAllArticlesHandler,
		ArticleChannel:        articleChannel,
	}

	if err := app.Run(); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
