package interfaces

import (
	"context"

	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FeedRepository interface {
	SaveFeed(ctx context.Context, feed models.Feed) error
}
