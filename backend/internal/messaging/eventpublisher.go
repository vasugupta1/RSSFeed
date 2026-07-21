package messaging

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type EventPublisher[T any] struct {
	connection *amqp.Connection
	queueName  string
}

func NewEventPublisher[T any](connection *amqp.Connection, queueName string) *EventPublisher[T] {
	return &EventPublisher[T]{
		connection: connection,
		queueName:  queueName,
	}
}

func (p *EventPublisher[T]) PublishEvent(ctx context.Context, body T) error {

	messagingChannel, err := p.connection.Channel()
	if err != nil {
		return err
	}

	defer func() {
		if closeErr := messagingChannel.Close(); closeErr != nil {
			slog.Error("Failed to close messaging channel cleanly", "err", closeErr)
			if err == nil {
				err = closeErr
			}
		}
	}()

	cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	bytes, err := json.Marshal(body)
	if err != nil {
		return err
	}

	event := amqp.Publishing{
		ContentType:  "",
		DeliveryMode: amqp.Persistent,
		Body:         bytes,
	}

	err = messagingChannel.PublishWithContext(cctx, "", p.queueName, false, false, event)

	if err != nil {
		slog.Error("Failed to publish event over channel", "err", err)
		return err
	}

	return nil
}
