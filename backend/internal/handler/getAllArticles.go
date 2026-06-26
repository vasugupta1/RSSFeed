package handler

import (
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
)

type GetAllArticlesHandler struct {
	Respository interfaces.FeedRepository
}

func NewGetAllArticlesHandler(r interfaces.FeedRepository) *GetAllArticlesHandler {
	return &GetAllArticlesHandler{
		Respository: r,
	}
}

func (h *GetAllArticlesHandler) GetAllArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := h.Respository.GetAllArticles(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, articles, nil)
}
