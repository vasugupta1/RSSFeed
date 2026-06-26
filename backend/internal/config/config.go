package config

import "os"

type APIConfiguration struct {
	Port                   string
	CrawlerApiUrl          string
	CosmosConnectionString string
	DatabaseName           string
	CollectionNames        []string
}

func Load() APIConfiguration {
	return APIConfiguration{
		Port:                   GetEnv("PORT", "8080"),
		CrawlerApiUrl:          GetEnv("services__rssfeedai__https__0", "http://localhost:8081"),
		CosmosConnectionString: GetEnv("ConnectionStrings__rssfeedurl", ""),
		DatabaseName:           "rssfeedurl",
		CollectionNames:        []string{"feedurl", "feedarticle"},
	}
}

func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
