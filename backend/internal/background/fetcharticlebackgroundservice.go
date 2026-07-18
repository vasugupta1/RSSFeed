package background

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/concurrency"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/service"
)

type FetchArticleBackGroundService struct {
	articles       <-chan repomodels.Articles
	crawlerService service.CrawlerService
	respository    interfaces.FeedRepository
	rateLimiter    *concurrency.RateLimiter[struct{}]
}

func NewFetchArticleBackGroundService(
	articlesChan <-chan repomodels.Articles,
	crawlerService service.CrawlerService,
	respository interfaces.FeedRepository,
	rateLimit int) *FetchArticleBackGroundService {
	return &FetchArticleBackGroundService{
		articles:       articlesChan,
		crawlerService: crawlerService,
		respository:    respository,
		rateLimiter:    concurrency.NewRateLimiter[struct{}](rateLimit),
	}
}

func (fa *FetchArticleBackGroundService) processArticle(ctx context.Context, a repomodels.Articles) {

	articleExists, err := fa.respository.ArticleExists(ctx, a.URL)

	if err != nil {
		slog.Error("Failed to search in the database if article exists", "error", err)
		return
	}

	if articleExists {
		return
	}

	crawlResponse, err := fa.crawlerService.CrawlUrl(ctx, a.URL)
	if err != nil {
		slog.Error("Failed to crawl url in the background service", "error", err)
		return
	}

	if crawlResponse == nil {
		slog.Error("Failed to crawl url in the background service", "error", err)
		return
	}

	articleSummary := models.ArticleSummary{
		Url:       crawlResponse.Url,
		Summary:   crawlResponse.Summary,
		Title:     crawlResponse.Title,
		Keywords:  crawlResponse.Keywords,
		CreatedAt: time.Now(),
	}
	if err := fa.respository.SaveArticle(ctx, articleSummary); err != nil {
		slog.Error("Failed to save article in database", "error", err)
	}
}

func (fa *FetchArticleBackGroundService) FetchArticleAndCache(ctx context.Context) {
	slog.Info("Starting Article Fectching Background service")
	heartbeat, results := concurrency.DoWork(ctx, time.Second, fa.articles)
	var wg sync.WaitGroup
	defer func() {
		slog.Info("Worker loop terminated. Draining running workers...")
		wg.Wait()
		slog.Info("All background workers exited cleanly.")
	}()

	for {
		select {
		case <-ctx.Done():
			slog.Info("Articles channel closed. Exiting background worker loop.")
			return
		case <-heartbeat:
			slog.Info("FetchArticleAndCache heartbeat successfull")
		case result, ok := <-results:
			if !ok {
				slog.Info("Result channel closed, stopping background worker")
				return
			}

			wg.Add(1)
			go func(a repomodels.Articles) {
				defer wg.Done()
				_, _ = fa.rateLimiter.Process(ctx, func() (struct{}, error) {
					fa.processArticle(ctx, a)
					return struct{}{}, nil
				})
			}(result)

		}
	}
}
