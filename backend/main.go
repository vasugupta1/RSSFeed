package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/vasugupta1/RSSFeed/backend/features/healthcheck"
	readurl "github.com/vasugupta1/RSSFeed/backend/features/readpage"
	"github.com/vasugupta1/RSSFeed/backend/models"
)

func loadConfig() (*models.APIConfiguration, error) {
	port := os.Getenv("PORT")
	crawlerApiUrl := os.Getenv("services__rssfeedai__https__0")

	if port == "" || crawlerApiUrl == "" {
		return nil, fmt.Errorf("missing required environment variables")
	}

	return &models.APIConfiguration{
		Port:          port,
		CrawlerApiUrl: crawlerApiUrl,
	}, nil
}

func main() {
	config, err := loadConfig()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		os.Exit(1)
	}

	r := gin.Default()

	handler := readurl.NewHandler(config.CrawlerApiUrl)
	r.POST("/api/reader", handler.ReadUrlHandler)
	r.GET("/api/healthcheck", healthcheck.HealthCheckHandler)
	r.Run(fmt.Sprintf(":%s", config.Port))
}
