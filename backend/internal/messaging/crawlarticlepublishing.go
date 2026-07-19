package messaging

import (
	"context"
	"encoding/json"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/vasugupta1/RSSFeed/backend/internal/models"
)

type CrawlArticlePublishing struct {
	crawlArticlePublishingChannel *amqp.Channel
	queueName                     string
}

func NewCrawlArticlePublishing(crawlArticlePublishingChannel *amqp.Channel, queueName string) *CrawlArticlePublishing {
	return &CrawlArticlePublishing{
		crawlArticlePublishingChannel: crawlArticlePublishingChannel,
		queueName:                     queueName,
	}
}

func (p *CrawlArticlePublishing) PublishArticle(ctx context.Context, ae models.CrawlArticleEvent) error {

	cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	bytes, err := json.Marshal(ae)
	if err != nil {
		return err
	}

	event := amqp.Publishing{
		ContentType:  "",
		DeliveryMode: amqp.Persistent,
		Body:         bytes,
	}

	perr := p.crawlArticlePublishingChannel.PublishWithContext(cctx, "", p.queueName, false, true, event)

	if perr != nil {
		return perr
	}

	return nil
}
