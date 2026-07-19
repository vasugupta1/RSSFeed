package background

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/concurrency"
	"github.com/vasugupta1/RSSFeed/backend/internal/messaging"
	eventmodel "github.com/vasugupta1/RSSFeed/backend/internal/models"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FetchArticleBackGroundService struct {
	articles       <-chan repomodels.Articles
	eventpublisher *messaging.EventPublisher[eventmodel.CrawlArticleEvent]
	rateLimiter    *concurrency.RateLimiter[struct{}]
}

func NewFetchArticleBackGroundService(
	articlesChan <-chan repomodels.Articles,
	eventPublisher *messaging.EventPublisher[eventmodel.CrawlArticleEvent],
	rateLimit int) *FetchArticleBackGroundService {
	return &FetchArticleBackGroundService{
		articles:       articlesChan,
		eventpublisher: eventPublisher,
		rateLimiter:    concurrency.NewRateLimiter[struct{}](rateLimit),
	}
}

func (fa *FetchArticleBackGroundService) PublishCrawlUrlEvent(ctx context.Context) {
	slog.Info("Starting Publish Crawl Url Event Background service")
	heartbeat, results := concurrency.DoWork(ctx, time.Minute, fa.articles)
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
			slog.Info("PublishCrawlUrlEvent heartbeat successfull")
		case result, ok := <-results:
			if !ok {
				slog.Info("Result channel closed, stopping PublishCrawlUrlEvent background worker")
				return
			}

			wg.Add(1)
			go func(a repomodels.Articles) {
				defer wg.Done()
				_, _ = fa.rateLimiter.Process(ctx, func() (struct{}, error) {

					event := eventmodel.CrawlArticleEvent{Url: a.URL}
					err := fa.eventpublisher.PublishEvent(ctx, event)
					if err != nil {
						slog.Error("PublishCrawlUrlEvent failed to publish event to channel", "err", err)
					}
					slog.Info("Published crawl event in PublishCrawlUrlEvent", "url", a.URL)
					return struct{}{}, nil
				})
			}(result)

		}
	}
}
