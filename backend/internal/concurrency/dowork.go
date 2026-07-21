package concurrency

import (
	"context"
	"time"
)

func DoWork[T any](ctx context.Context,
	pulseInterval time.Duration,
	in <-chan T) (<-chan struct{}, <-chan T) {
	heartbeat := make(chan struct{})
	results := make(chan T)

	go func() {
		defer close(heartbeat)
		defer close(results)

		pulse := time.NewTicker(pulseInterval)
		defer pulse.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-pulse.C:
				select {
				case heartbeat <- struct{}{}:
				default:
				}
			case val, ok := <-in:
				if !ok {
					return
				}
				select {
				case <-ctx.Done():
					return
				case results <- val:
				}
			}
		}
	}()

	return heartbeat, results
}
