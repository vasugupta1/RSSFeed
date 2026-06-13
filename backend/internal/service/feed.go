package service

type FeedService interface {
	// UpsertFeedUrl will be implemented when the feature is ready
}

type feedService struct {
}

func NewFeedService() FeedService {
	return &feedService{}
}
