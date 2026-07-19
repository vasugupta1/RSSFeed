package background

import (
	"context"
	"encoding/xml"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/vasugupta1/RSSFeed/backend/internal/models"
	"github.com/vasugupta1/RSSFeed/backend/internal/repository/interfaces"
	repomodels "github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
)

type FetchNewUrlArticlesBackGroudService struct {
	articlesChannel chan<- repomodels.Articles
	repository      interfaces.FeedRepository
}

func NewFetchFeedUrlArticlesBackGroudService(a chan<- repomodels.Articles, r interfaces.FeedRepository) *FetchNewUrlArticlesBackGroudService {
	return &FetchNewUrlArticlesBackGroudService{
		articlesChannel: a,
		repository:      r,
	}
}

func (fu *FetchNewUrlArticlesBackGroudService) FetchFeedUrlArticleAndCache(ctx context.Context) {
	// slog.Info("Starting fetching of existing urls")

	// ticker := time.NewTicker(1 * time.Minute)
	// defer ticker.Stop()

	// for {

	// 	select {
	// 	case <-ctx.Done():
	// 		slog.Info("fetch new article background service finished")
	// 		return

	// 	case <-ticker.C:
	// 		feeds, err := fu.repository.GetAllFeed(ctx)
	// 		if err != nil {
	// 			slog.Error("Failed to get all feeds from database", "error", err)
	// 			return
	// 		}

	// 		urlList := make([]string, len(feeds))
	// 		for i, feed := range feeds {
	// 			urlList[i] = feed.Link
	// 		}
	// 		slog.Info("Tick received: spawning goroutines for URL fetching", "count", len(urlList))
	// 		var wg sync.WaitGroup
	// 		for _, url := range urlList {
	// 			wg.Add(1)
	// 			go func(targetUrl string) {
	// 				defer wg.Done()
	// 				fu.fetchAndUploadArticleToChannel(ctx, targetUrl, fu.articlesChannel)
	// 			}(url)
	// 		}
	// 		wg.Wait()
	// 	}

	// }
}

func (fu *FetchNewUrlArticlesBackGroudService) fetchAndUploadArticleToChannel(ctx context.Context, targetUrl string, ch chan<- repomodels.Articles) {
	rss, err := callRssFeedUrl(ctx, targetUrl)
	if err != nil {
		slog.Error("Failed to get RssXML", "url", targetUrl, "error", err)
		return
	}

	feed, err := mapToFeed(rss, targetUrl)
	if err != nil {
		slog.Error("Failed to map to Feed model", "url", targetUrl, "error", err)
		return
	}

	for _, article := range feed.Articles {
		select {
		case ch <- article:
		case <-ctx.Done():
			return
		}
	}
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
