package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	gqhandler "github.com/99designs/gqlgen/graphql/handler"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/vasugupta1/RSSFeed/backend/internal/background"
	"github.com/vasugupta1/RSSFeed/backend/internal/client"
	"github.com/vasugupta1/RSSFeed/backend/internal/config"
	"github.com/vasugupta1/RSSFeed/backend/internal/graph"
	"github.com/vasugupta1/RSSFeed/backend/internal/handler"
	"github.com/vasugupta1/RSSFeed/backend/internal/messaging"
	event "github.com/vasugupta1/RSSFeed/backend/internal/models"
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
			slog.Error("Failed to close connection to database", "err", err)
		}
	}()

	// Initialize RabbitMq connection
	conn, err := amqp.Dial(cfg.PublishingChannelUri)
	if err != nil {
		slog.Error("Failed to connect to messaging", "err", err)
		os.Exit(1)
	}

	defer func() {
		if err := conn.Close(); err != nil {
			slog.Error("Failed to close connection to messaging", "err", err)
			os.Exit(1)
		}
	}()

	articleCrawlPublisher := messaging.NewEventPublisher[event.CrawlArticleEvent](conn, cfg.CrawlEventQueueName)
	articleCrawlResultconsumer := messaging.NewEventConsumer[models.ArticleSummary](conn, cfg.CrawlEventResultQueueName, "bff")

	// Initialize clients
	crawlerClient := client.NewCrawlerClient(cfg.CrawlerApiUrl)
	graphClient := client.NewGraphApiClient(cfg.GraphApiUrl)

	// Initialize services
	crawlerService := service.NewCrawlerService(crawlerClient, cfg.ApiRateLimitValue)

	// Initialize Background service
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	articleChannel := make(chan models.Articles, 100)
	articleSaveBackGroundService := background.NewFetchArticleBackGroundService(articleChannel, articleCrawlPublisher, cfg.ApiRateLimitValue)
	go articleSaveBackGroundService.PublishCrawlUrlEvent(ctx)

	articleConsumerService := background.NewConsumeCrawlProcessingEvent(articleCrawlResultconsumer, respositoryService)
	go articleConsumerService.ConsumeCrawlUrlResultEvent(ctx)

	processNewArticlesService := background.NewProcessNewArticles(articleChannel, respositoryService, time.Duration(cfg.RSSFeedRefreshDurationMin)*time.Minute)
	go processNewArticlesService.ProcessNewRssFeedArticles(ctx)

	// Initialize handlers
	crawlerHandler := handler.NewCrawlerHandler(crawlerService, respositoryService)
	feedHandler := handler.NewFeedHandler(respositoryService, articleChannel)
	healthHandler := handler.NewHealthCheckHandler()
	getAllArticlesHandler := handler.NewGetAllArticlesHandler(respositoryService)
	deleteArticleHandler := handler.NewDeleteArticleHandler(respositoryService)
	syncFeedHandler := handler.NewSyncFeedHandler(respositoryService, articleChannel)

	// Initialize GraphQl resolver
	graphQlServiceResolver := &graph.Resolver{
		GraphClient: graphClient,
	}
	graphqlServer := gqhandler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: graphQlServiceResolver}))

	// Start the server
	app := &server.Application{
		Config:                cfg,
		CrawlerHandler:        crawlerHandler,
		FeedHandler:           feedHandler,
		HealthHandler:         healthHandler,
		GetAllArticlesHandler: getAllArticlesHandler,
		ArticleChannel:        articleChannel,
		DeleteArticleHandler:  deleteArticleHandler,
		SyncFeedHandler:       syncFeedHandler,
		GraphQlServer:         graphqlServer,
	}

	if err := app.Run(); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
