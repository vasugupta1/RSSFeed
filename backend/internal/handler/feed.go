package handler

import (
	"encoding/xml"
	"io"
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FeedHandler struct {
	Respository     interfaces.FeedRepository
	articlesChannel chan repomodels.Articles
}

func NewFeedHandler(respository interfaces.FeedRepository, articlesChannel chan repomodels.Articles) *FeedHandler {
	return &FeedHandler{Respository: respository, articlesChannel: articlesChannel}
}

func (h *FeedHandler) UpsertFeedUrl(w http.ResponseWriter, r *http.Request) {
	requestBody, err := httputil.ReadJSON[models.UpsertFeedRequest](r)
	if err != nil {
		slog.Error("Failed to parse crawler request", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
	rssXml, err := callRssFeedUrls(requestBody.URL)
	if err != nil {
		slog.Error("Failed to parse crawler request", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	feed, err := mapToFeed(rssXml)
	if err != nil {
		slog.Error("Failed to parse crawler request", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	h.Respository.SaveFeed(r.Context(), *feed)
	for _, article := range feed.Articles {
		h.articlesChannel <- article
	}
	httputil.WriteJSON(w, http.StatusOK, "ok", nil)
}

func callRssFeedUrls(url string) (*models.RssXml, error) {
	client := &http.Client{}
	res, err := client.Get(url)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var rss models.RssXml
	xml_error := xml.Unmarshal(body, &rss)
	if xml_error != nil {
		return nil, xml_error
	}

	return &rss, nil
}

func mapToFeed(rssXml *models.RssXml) (*repomodels.Feed, error) {
	dbArticles := make([]repomodels.Articles, 0, len(rssXml.Channel.Items))
	for _, item := range rssXml.Channel.Items {
		dbArticles = append(dbArticles, repomodels.Articles{
			Title: item.Title,
			URL:   item.Link,
		})
	}
	return &repomodels.Feed{
		Title:       rssXml.Channel.Title,
		Description: rssXml.Channel.Description,
		Link:        rssXml.Channel.Link,
		Articles:    dbArticles,
	}, nil
}
