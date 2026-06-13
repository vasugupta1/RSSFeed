package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/model"
	"github.com/vasugupta1/RSSFeed/backend/internal/service"
)

type CrawlerHandler struct {
	service service.CrawlerService
}

func NewCrawlerHandler(s service.CrawlerService) *CrawlerHandler {
	return &CrawlerHandler{
		service: s,
	}
}

func (h *CrawlerHandler) HandleCrawl(w http.ResponseWriter, r *http.Request) {
	requestBody, err := parseCrawlerPayload(r)
	if err != nil {
		slog.Error("Failed to parse crawler request", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	serviceResponse, err := h.service.CrawlUrl(r.Context(), requestBody.URL)
	if err != nil {
		slog.Error("Failed to get a response from crawler ai service", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, serviceResponse, nil)
}

func parseCrawlerPayload(r *http.Request) (*model.CrawlerRequest, error) {
	bodyData, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	requestBody := &model.CrawlerRequest{}
	err = json.Unmarshal(bodyData, requestBody)
	if err != nil {
		return nil, err
	}
	return requestBody, nil
}
