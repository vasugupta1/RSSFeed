package config

import "os"

type APIConfiguration struct {
	Port                      string
	CrawlerApiUrl             string
	GraphApiUrl               string
	CosmosConnectionString    string
	DatabaseName              string
	CollectionNames           []string
	ApiRateLimitValue         int
	CrawlEventQueueName       string
	CrawlEventResultQueueName string
	PublishingChannelUri      string
	RSSFeedRefreshDurationMin int
}

func Load() APIConfiguration {
	return APIConfiguration{
		Port:                      GetEnv("PORT", "8080"),
		CrawlerApiUrl:             GetEnv("services__rssfeedai__http__0", GetEnv("services__rssfeedai__https__0", "http://localhost:8001")),
		GraphApiUrl:               GetEnv("services__rssfeedai__http__0", GetEnv("services__rssfeedai__https__0", "http://localhost:8001")),
		CosmosConnectionString:    GetEnv("ConnectionStrings__rssfeedurl", ""),
		DatabaseName:              "rssfeedurl",
		CollectionNames:           []string{"feedurl", "feedarticle"},
		ApiRateLimitValue:         5,
		CrawlEventQueueName:       GetEnv("RABBITMQ_CRAWL_CRAWL_QUEUE", "rssfeed-article-crawl-event"),
		CrawlEventResultQueueName: GetEnv("RABBITMQ_CRAWL_RESULT_QUEUE", "rssfeed-article-crawl-result-event"),
		PublishingChannelUri:      GetEnv("MESSAGING_URI", ""),
		RSSFeedRefreshDurationMin: 60,
	}
}

func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
