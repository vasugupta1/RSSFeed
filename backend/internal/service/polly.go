package service

import (
	"context"
)

type Polly[T any] struct {
	ch chan struct{}
}

func NewPolly[T any](limit int) *Polly[T] {
	return &Polly[T]{
		ch: make(chan struct{}, limit),
	}
}

func (p *Polly[T]) Process(ctx context.Context, f func() (T, error)) (T, error) {
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
