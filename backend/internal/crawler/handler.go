package crawler

import (
	"encoding/json"
	"io"

	"log/slog"
	"net/http"

	internalJson "github.com/vasugupta1/RSSFeed/backend/internal/json"
)

type CrawlerRequest struct {
	URL string `json:"url"`
}

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{
		service: service,
	}
}

func getPayload(r *http.Request) (*CrawlerRequest, error) {
	bodyData, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	requestBody := &CrawlerRequest{}
	err = json.Unmarshal(bodyData, requestBody)
	if err != nil {
		return nil, err
	}
	return requestBody, nil
}

func (h *Handler) CrawlerHandler(w http.ResponseWriter, r *http.Request) {
	requestBody, err := getPayload(r)
	if err != nil {
		slog.Error("Failed to get a response from crawler ai service", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	serviceRespopnse, err := h.service.CrawlUrl(r.Context(), requestBody.URL)
	if err != nil {
		slog.Error("Failed to get a response from crawler ai service", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	internalJson.Write(w, http.StatusOK, serviceRespopnse, nil)
}
