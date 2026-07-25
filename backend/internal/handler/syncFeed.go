package handler

import (
	"context"
	"encoding/xml"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/httputil"
	"github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type SyncFeedHandler struct {
	respository     interfaces.FeedRepository
	articlesChannel chan<- repomodels.Articles
}

func NewSyncFeedHandler(r interfaces.FeedRepository, ac chan<- repomodels.Articles) *SyncFeedHandler {
	return &SyncFeedHandler{
		respository:     r,
		articlesChannel: ac,
	}
}

func (s *SyncFeedHandler) SyncFeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	feeds, err := s.respository.GetAllFeed(ctx)
	if err != nil {
		slog.Error("Failed to get all feeds from database", "error", err)
		return
	}

	var wg sync.WaitGroup
	for _, feed := range feeds {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			if err := s.processRssFeedLink(ctx, url); err != nil {
				slog.Error("Failed to process feed", "url", url, "error", err)
			}
		}(feed.Link)
	}
	wg.Wait()
	httputil.WriteJSON(w, http.StatusAccepted, nil, nil)
}

func (s *SyncFeedHandler) processRssFeedLink(ctx context.Context, link string) error {
	rss, err := callRssFeedUrl(ctx, link)
	if err != nil {
		slog.Error("Failed to get RssXML", "url", link, "error", err)
		return err
	}

	feed, err := mapToFeedModel(rss, link)
	if err != nil {
		slog.Error("Failed to map to Feed model", "url", link, "error", err)
		return err
	}

	for _, article := range feed.Articles {
		select {
		case s.articlesChannel <- article:
		case <-ctx.Done():
			slog.Warn("Context cancelled while pushing articles to channel", "url", link)
			return ctx.Err()
		}
	}

	return nil
}

func callRssFeedUrl(ctx context.Context, url string) (*models.RssXml, error) {
	slog.Info("Fetching Rss feed article", "url", url)
	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	res, err := client.Do(req)
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

func mapToFeedModel(rssXml *models.RssXml, feed string) (*repomodels.Feed, error) {
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
		Link:        feed,
		Articles:    dbArticles,
		CreatedAt:   time.Now(),
	}, nil
}
