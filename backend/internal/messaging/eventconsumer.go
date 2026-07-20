package messaging

import (
	"context"
	"encoding/json"
	"log/slog"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/vasugupta1/RSSFeed/backend/internal/concurrency"
)

type EventConsumer[T any] struct {
	connection   *amqp.Connection
	queueName    string
	consumerName string
}

func NewEventConsumer[T any](connection *amqp.Connection, queueName string, consumerName string) *EventConsumer[T] {
	return &EventConsumer[T]{
		connection:   connection,
		queueName:    queueName,
		consumerName: consumerName,
	}
}

func (c *EventConsumer[T]) ConsumeEvent(ctx context.Context) (<-chan T, error) {
	messagingChannel, err := c.connection.Channel()
	if err != nil {
		return nil, err
	}

	msgs, err := messagingChannel.Consume(c.queueName, c.consumerName, false, false, false, false, nil)
	if err != nil {
		messagingChannel.Close()
		return nil, err
	}

	out := make(chan T)
	deliveryMessage := concurrency.OrDone(ctx, msgs)

	go func() {
		defer func() {
			close(out)
			if closeErr := messagingChannel.Close(); closeErr != nil {
				slog.Error("Failed to close messaging channel cleanly", "err", closeErr)
			}
		}()

		for d := range deliveryMessage {
			event, err := c.unmarshalDelivery(d)
			if err != nil {
				slog.Error("Failed to parse incoming event", "err", err, "message_id", d.MessageId)
				_ = d.Nack(false, true) // Requeue or handle poison pill logic here
				continue
			}

			select {
			case <-ctx.Done():
				return
			case out <- event:
				if err := d.Ack(false); err != nil {
					slog.Error("Failed to acknowledge streamed event", "err", err)
				}
			}
		}

	}()

	return out, nil

}

func (c *EventConsumer[T]) unmarshalDelivery(d amqp.Delivery) (T, error) {
	var val T
	err := json.Unmarshal(d.Body, &val)
	if err != nil {
		return val, err
	}
	slog.Info("DEBUGGGGGGGG", "val", val)
	return val, nil
}
