package interfaces

import (
	"context"

	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FeedRepository interface {
	SaveFeed(ctx context.Context, feed models.Feed) error
	GetAllFeed(ctx context.Context) ([]models.Feed, error)
	SaveArticle(ctx context.Context, articleSummary models.ArticleSummary) error
	GetArticle(ctx context.Context, url string) (*models.ArticleSummary, error)
	GetAllArticles(ctx context.Context) ([]models.ArticleSummary, error)
	DeleteArticle(ctx context.Context, url string) error
	ArticleExists(ctx context.Context, url string) (bool, error)
}
