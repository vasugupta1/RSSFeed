package client

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/vasugupta1/RSSFeed/backend/internal/models"
)

type GraphApiClient struct {
	baseUrl    string
	httpClient *http.Client
}

func NewGraphApiClient(baseUrl string) *GraphApiClient {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	return &GraphApiClient{
		baseUrl:    strings.TrimSuffix(baseUrl, "/"),
		httpClient: &http.Client{Transport: tr},
	}
}

func (c *GraphApiClient) GetEntites(ctx context.Context, entity string) (models.Entity, error) {
	var result models.Entity
	if entity == "" {
		return result, fmt.Errorf("entity cannot be empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/entity?name=%s", c.baseUrl, url.QueryEscape(entity)), nil)
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

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/relationship?entity=%s", c.baseUrl, url.QueryEscape(entity)), nil)
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

func (c *GraphApiClient) GetEntitiesRelationship(ctx context.Context, keyword string) (models.GetEntitiesRelationshipResponse, error) {
	var result models.GetEntitiesRelationshipResponse
	if keyword == "" {
		return result, fmt.Errorf("keyword cannot be empty")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/relationship?keyword=%s", c.baseUrl, url.QueryEscape(keyword)), nil)
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
