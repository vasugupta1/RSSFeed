package models

type UpsertFeedRequest struct {
	URL string `json:"url"`
}

type UpsertFeedResponse struct {
	RssXml
}
