package handler

import (
	"encoding/xml"
	"io"
	"log/slog"
	"net/http"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	model "github.com/vasugupta1/RSSFeed/backend/internal/models"
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

	rssXml, err := callRssFeedUrls("https://feeds.skynews.com/feeds/rss/home.xml")
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
	httputil.WriteJSON(w, http.StatusOK, "ok", nil)
}

func callRssFeedUrls(url string) (*model.RssXml, error) {
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

	var rss model.RssXml
	xml_error := xml.Unmarshal(body, &rss)
	if xml_error != nil {
		return nil, xml_error
	}

	return &rss, nil
}

func mapToFeed(rssXml *model.RssXml) (*models.Feed, error) {
	dbArticles := make([]models.Articles, 0, len(rssXml.Channel.Items))
	for _, item := range rssXml.Channel.Items {
		dbArticles = append(dbArticles, models.Articles{
			Title: item.Title,
			URL:   item.Link,
		})
	}
	return &models.Feed{
		Title:       rssXml.Channel.Title,
		Description: rssXml.Channel.Description,
		Link:        rssXml.Channel.Link,
		Articles:    dbArticles,
	}, nil
}
