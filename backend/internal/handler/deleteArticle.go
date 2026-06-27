package handler

import (
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
)

type DeleteArticleHandler struct {
	Respository interfaces.FeedRepository
}

func NewDeleteArticleHandler(r interfaces.FeedRepository) *DeleteArticleHandler {
	return &DeleteArticleHandler{
		Respository: r,
	}
}

func (h *DeleteArticleHandler) DeleteArticle(w http.ResponseWriter, r *http.Request) {

	requestBody, err := httputil.ReadJSON[models.DeleteArticleRequest](r)
	if err != nil {
		slog.Error("Failed to parse crawler request", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
	h.Respository.DeleteArticle(r.Context(), requestBody.URL)
	httputil.WriteJSON(w, http.StatusOK, "ok", nil)
}
