package concurrency

import (
	"context"
)

type RateLimiter[T any] struct {
	ch chan struct{}
}

func NewRateLimiter[T any](limit int) *RateLimiter[T] {
	return &RateLimiter[T]{
		ch: make(chan struct{}, limit),
	}
}

func (p *RateLimiter[T]) Process(ctx context.Context, f func() (T, error)) (T, error) {
	select {
	case <-ctx.Done():
		var zero T
		return zero, ctx.Err()

	case p.ch <- struct{}{}:
		res, error := f()
		<-p.ch
		return res, error
	}
}
