package readurl

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ReadRequest struct {
	Url string `json:"url"`
}

type ReadResponse struct {
	Url      string `json:"Url"`
	Response string `json:"Response"`
}

type Handler struct {
	CrawlerApiUrl string
}

func NewHandler(crawlerApiUrl string) *Handler {
	return &Handler{
		CrawlerApiUrl: crawlerApiUrl,
	}
}

func (r *ReadRequest) Validate() error {
	if r.Url == "" {
		return fmt.Errorf("url is required")
	}
	return nil
}

func (r *Handler) callCrawlerApi(url string) (*ReadResponse, error) {
	res, err := http.Get(fmt.Sprintf("%s/api/crawl?url=%s", r.CrawlerApiUrl, url))
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("crawler API returned status code %d", res.StatusCode)
	}

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var result ReadResponse

	err = json.Unmarshal(bodyBytes, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to parse crawler API response: %v", err)
	}

	return &result, nil
}

func (r *Handler) ReadUrlHandler(c *gin.Context) {
	var req ReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	if err := req.Validate(); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	response, err := r.callCrawlerApi(req.Url)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to call crawler API"})
		return
	}

	c.JSON(200, response)
}
