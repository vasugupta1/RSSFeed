package concurrency

import "context"

func OrDone[T any](ctx context.Context, c <-chan T) <-chan T {
	out := make(chan T)
	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case val, ok := <-c:
				if ok == false {
					return
				}
				select {
				case <-ctx.Done():
				case out <- val:
				}
			}
		}
	}()

	return out
}
