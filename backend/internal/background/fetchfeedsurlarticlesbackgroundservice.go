package background

import (
	"context"
	"encoding/xml"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FetchFeedUrlArticlesBackGroudService struct {
	articlesChannel chan<- repomodels.Articles
	repository      interfaces.FeedRepository
}

func NewFetchFeedUrlArticlesBackGroudService(a chan<- repomodels.Articles, r interfaces.FeedRepository) *FetchFeedUrlArticlesBackGroudService {
	return &FetchFeedUrlArticlesBackGroudService{
		articlesChannel: a,
		repository:      r,
	}
}

func (fu *FetchFeedUrlArticlesBackGroudService) FetchFeedUrlArticleAndCache(ctx context.Context) {
	slog.Info("Starting fetching of existing urls")
	feeds, err := fu.repository.GetAllFeed(ctx)
	if err != nil {
		slog.Error("Failed to get all feeds from database")
		return
	}

	urlList := make([]string, len(feeds))
	for i, feed := range feeds {
		urlList[i] = feed.Link
	}

	go func() {
		var wg sync.WaitGroup
		maxCon := 10
		semaphore := make(chan struct{}, maxCon)

		for _, url := range urlList {
			wg.Add(1)
			semaphore <- struct{}{}

			go func(targetURL string) {
				defer wg.Done()
				defer func() { <-semaphore }()

				rss, err := callRssFeedUrls(targetURL)
				if err != nil {
					slog.Error("Failed to get RssXML", "url", targetURL, "error", err)
					return
				}

				feed, err := mapToFeed(rss, targetURL)
				if err != nil {
					slog.Error("Failed to map to Feed model", "url", targetURL, "error", err)
					return
				}

				for _, article := range feed.Articles {
					select {
					case fu.articlesChannel <- article:
					case <-ctx.Done():
						return
					}
				}

			}(url)

		}

		wg.Wait()

	}()

}

func callRssFeedUrls(url string) (*models.RssXml, error) {
	slog.Info("Fetching Rss feed articles")
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

func mapToFeed(rssXml *models.RssXml, feed string) (*repomodels.Feed, error) {
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
