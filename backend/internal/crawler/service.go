package crawler

import (
	"context"

	"github.com/vasugupta1/RSSFeed/backend/internal/crawlerapiclient"
)

type Service interface {
	CrawlUrl(ctx context.Context, url string) (*crawlerapiclient.CrawlUrlResponse, error)
}

type svc struct {
	crawlerService *crawlerapiclient.CrawlerApiClient
}

func NewService(cs *crawlerapiclient.CrawlerApiClient) Service {
	return &svc{
		crawlerService: cs,
	}
}

func (s *svc) CrawlUrl(ctx context.Context, url string) (*crawlerapiclient.CrawlUrlResponse, error) {
	res, err := s.crawlerService.CrawlUrl(url)
	if err != nil {
		return nil, err
	}
	return res, nil
}
