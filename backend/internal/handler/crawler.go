package handler

import (
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	"github.com/vasugupta1/RSSFeed/backend/internal/service"
)

type CrawlerHandler struct {
	service     service.CrawlerService
	respository interfaces.FeedRepository
}

func NewCrawlerHandler(s service.CrawlerService, r interfaces.FeedRepository) *CrawlerHandler {
	return &CrawlerHandler{
		service:     s,
		respository: r,
	}
}

func (h *CrawlerHandler) HandleCrawl(w http.ResponseWriter, r *http.Request) {
	requestBody, err := httputil.ReadJSON[models.CrawlerRequest](r)
	if err != nil {
		slog.Error("Failed to parse crawler request", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cachedModel, error := h.respository.GetArticle(r.Context(), requestBody.URL)
	if error != nil {
		slog.Error("Errored when trying to check cached", "error", err)
	}
	if cachedModel != nil {
		response := &models.CrawlUrlResponse{
			Url:      cachedModel.Url,
			Title:    cachedModel.Title,
			Summary:  cachedModel.Summary,
			Keywords: cachedModel.Keywords,
		}
		httputil.WriteJSON(w, http.StatusOK, response, nil)
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
