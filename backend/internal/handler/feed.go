package handler

import (
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FeedHandler struct {
	Respository interfaces.FeedRepository
}

func NewFeedHandler(respository interfaces.FeedRepository) *FeedHandler {
	return &FeedHandler{Respository: respository}
}

func (h *FeedHandler) UpsertFeedUrl(w http.ResponseWriter, r *http.Request) {

	h.Respository.SaveFeed(r.Context(), models.Feed{})
	httputil.WriteJSON(w, http.StatusOK, "ok", nil)
}
