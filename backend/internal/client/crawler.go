package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/vasugupta1/RSSFeed/backend/internal/models"
)

type CrawlerApiClient struct {
	baseUrl    string
	httpClient *http.Client
}

func NewCrawlerClient(baseUrl string) *CrawlerApiClient {
	return &CrawlerApiClient{
		baseUrl:    strings.TrimSuffix(baseUrl, "/"),
		httpClient: &http.Client{},
	}
}

func (c *CrawlerApiClient) CrawlUrl(ctx context.Context, url string) (*models.CrawlUrlResponse, error) {
	if url == "" {
		return nil, fmt.Errorf("url cannot be null or empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/crawl?url=%s", c.baseUrl, url), nil)

	res, err := c.httpClient.Do(req)

	if res.StatusCode != http.StatusOK || err != nil {
		return nil, fmt.Errorf("crawler API returned status code %d", res.StatusCode)
	}

	defer res.Body.Close()

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var result models.CrawlUrlResponse

	err = json.Unmarshal(bodyBytes, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to parse crawler API response: %v", err)
	}

	return &result, nil
}
