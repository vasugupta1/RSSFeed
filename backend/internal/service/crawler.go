package service

import (
	"context"

	"github.com/vasugupta1/RSSFeed/backend/internal/client"
	"github.com/vasugupta1/RSSFeed/backend/internal/concurrency"
	"github.com/vasugupta1/RSSFeed/backend/internal/models"
)

type CrawlerService interface {
	CrawlUrl(ctx context.Context, url string) (*models.CrawlUrlResponse, error)
}

type crawlerService struct {
	crawlerClient *client.CrawlerApiClient
	polly         *concurrency.RateLimiter[*models.CrawlUrlResponse]
}

func NewCrawlerService(cc *client.CrawlerApiClient, rateLimiter int) CrawlerService {
	return &crawlerService{
		crawlerClient: cc,
		polly:         concurrency.NewRateLimiter[*models.CrawlUrlResponse](rateLimiter),
	}
}

func (s *crawlerService) CrawlUrl(ctx context.Context, url string) (*models.CrawlUrlResponse, error) {

	result, error := s.polly.Process(ctx, func() (*models.CrawlUrlResponse, error) {
		res, err := s.crawlerClient.CrawlUrl(ctx, url)
		if err != nil {
			return nil, err
		}
		return res, nil
	})

	if error != nil {
		return nil, error
	}

	return result, nil
}
