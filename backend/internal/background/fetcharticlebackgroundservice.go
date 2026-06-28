package background

import (
	"context"
	"log/slog"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/service"
)

type FetchArticleBackGroundService struct {
	articles       <-chan repomodels.Articles
	crawlerService service.CrawlerService
	respository    interfaces.FeedRepository
}

func NewFetchArticleBackGroundService(articlesChan <-chan repomodels.Articles, crawlerService service.CrawlerService, respository interfaces.FeedRepository) *FetchArticleBackGroundService {
	return &FetchArticleBackGroundService{
		articles:       articlesChan,
		crawlerService: crawlerService,
		respository:    respository,
	}
}

func (fa *FetchArticleBackGroundService) FetchArticleAndCache(ctx context.Context) {

	for {
		select {
		case <-ctx.Done():
			return
		case article, ok := <-fa.articles:
			if !ok {
				slog.Info("Articles channel closed. Exiting background worker loop.")
				return
			}
			crawlResponse, err := fa.crawlerService.CrawlUrl(ctx, article.URL)
			if crawlResponse == nil {
				slog.Error("Failed to crawl url in the background service", "error", err)
				return
			}
			if err != nil {
				slog.Error("Failed to crawl url in the background service", "error", err)
				return
			}
			articleSummary := models.ArticleSummary{Url: crawlResponse.Url, Summary: crawlResponse.Response, Title: article.Title, CreatedAt: time.Now()}
			if err := fa.respository.SaveArticle(ctx, articleSummary); err != nil {
				slog.Error("Failed to save article in database", "error", err)
			}
		}
	}
}
