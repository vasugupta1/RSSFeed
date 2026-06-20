package models

type CrawlerRequest struct {
	URL string `json:"url"`
}

type CrawlUrlResponse struct {
	Url      string `json:"Url"`
	Response string `json:"Response"`
}
