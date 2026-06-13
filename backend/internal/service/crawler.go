package service

import (
	"context"

	"github.com/vasugupta1/RSSFeed/backend/internal/client"
	"github.com/vasugupta1/RSSFeed/backend/internal/model"
)

type CrawlerService interface {
	CrawlUrl(ctx context.Context, url string) (*model.CrawlUrlResponse, error)
}

type crawlerService struct {
	crawlerClient *client.CrawlerApiClient
}

func NewCrawlerService(cc *client.CrawlerApiClient) CrawlerService {
	return &crawlerService{
		crawlerClient: cc,
	}
}

func (s *crawlerService) CrawlUrl(ctx context.Context, url string) (*model.CrawlUrlResponse, error) {
	res, err := s.crawlerClient.CrawlUrl(url)
	if err != nil {
		return nil, err
	}
	return res, nil
}
