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

type GraphApiClient struct {
	baseUrl    string
	httpClient *http.Client
}

func NewGraphApiClient(baseUrl string) *GraphApiClient {
	return &GraphApiClient{
		baseUrl:    strings.TrimSuffix(baseUrl, "/"),
		httpClient: &http.Client{},
	}
}

func (c *GraphApiClient) GetEntites(ctx context.Context, entity string) (models.Entity, error) {
	var result models.Entity
	if entity == "" {
		return result, fmt.Errorf("entity cannot be empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/entity?name=%s", c.baseUrl, entity), nil)
	if err != nil {
		return result, err
	}

	res, err := c.httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		return result, err
	}

	defer res.Body.Close()

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return result, err
	}

	err = json.Unmarshal(bodyBytes, &result)
	if err != nil {
		return result, err
	}

	return result, nil

}

func (c *GraphApiClient) GetRelationShips(ctx context.Context, entity string) (models.Relationship, error) {
	var result models.Relationship
	if entity == "" {
		return result, fmt.Errorf("entity cannot be empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/relationship?entity=%s", c.baseUrl, entity), nil)
	if err != nil {
		return result, err
	}

	res, err := c.httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		return result, err
	}

	defer res.Body.Close()

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return result, err
	}

	err = json.Unmarshal(bodyBytes, &result)
	if err != nil {
		return result, err
	}

	return result, nil
}
