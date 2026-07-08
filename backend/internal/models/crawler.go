package models

type CrawlerRequest struct {
	URL string `json:"url"`
}

type CrawlUrlResponse struct {
	Url      string   `json:"url"`
	Title    string   `json:"title"`
	Summary  []string `json:"summary"`
	Keywords []string `json:"keywords"`
}
