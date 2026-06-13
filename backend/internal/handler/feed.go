package handler

import "net/http"

type FeedHandler struct {
}

func NewFeedHandler() *FeedHandler {
	return &FeedHandler{}
}

func (h *FeedHandler) UpsertFeedUrl(w http.ResponseWriter, r *http.Request) {
	//1. First make a call to get the xml from the url
	// Also save the feed url in the database, that way we can retrieve the urls on load up
	//2. Parse the xml and save current state of the feed this most likely might be stored in the redis cache
	//3. Return 200
}
