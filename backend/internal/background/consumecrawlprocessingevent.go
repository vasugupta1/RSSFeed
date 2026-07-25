package background

import (
	"context"
	"log/slog"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/concurrency"
	"github.com/vasugupta1/RSSFeed/backend/internal/messaging"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type ConsumeCrawlProcessingEvent struct {
	eventConsumer *messaging.EventConsumer[models.ArticleSummary]
	repository    interfaces.FeedRepository
}

func NewConsumeCrawlProcessingEvent(eventConsumer *messaging.EventConsumer[models.ArticleSummary], repository interfaces.FeedRepository) *ConsumeCrawlProcessingEvent {
	return &ConsumeCrawlProcessingEvent{
		eventConsumer: eventConsumer,
		repository:    repository,
	}
}

func (fa *ConsumeCrawlProcessingEvent) ConsumeCrawlUrlResultEvent(ctx context.Context) {
	slog.Info("Starting Consume Crawl Url Event Background service")

	eventStream, err := fa.eventConsumer.ConsumeEvent(ctx)
	if err != nil {
		slog.Error("Failed to initiate event consumer stream", "err", err)
		return
	}

	heartbeat, results := concurrency.DoWork(ctx, time.Minute, eventStream)
	go func() {
		for {

			select {
			case <-ctx.Done():
				return

			case _, ok := <-heartbeat:
				if !ok {
					slog.Warn("Heartbeat channel closed! Worker loop has stopped.")
					return
				}
				slog.Debug("Still healthy - received pulse")

			case val, ok := <-results:
				if !ok {
					slog.Info("Results channel closed. Stream finished.")
					return
				}

				fa.processEvent(ctx, val)

			}

		}

	}()
}

func (fa *ConsumeCrawlProcessingEvent) processEvent(ctx context.Context, val models.ArticleSummary) error {
	exists, err := fa.repository.ArticleExists(ctx, val.Url)
	if err != nil {
		slog.Warn("Failed to check if article exists", "url", val.Url, "err", err)
		return nil
	}
	if exists {
		slog.Debug("Article already exists, skipping", "url", val.Url)
		return nil
	}
	err = fa.repository.SaveArticle(ctx, val)
	if err != nil {
		slog.Warn("Failed to save article", "url", val.Url)
		return err
	}
	return nil
}
