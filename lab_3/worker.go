package main

import (
	"context"
)

func worker(ctx context.Context, jobs <-chan Job, results chan<- Result,) {
	for {
		select {
		case job, ok := <-jobs:
			if !ok {
				return
			}

			result := processJob(job)

			select {
			case results <- result:
			case <-ctx.Done():
				return
			}

		case <-ctx.Done():
			return
		}
	}
}

func processJob(job Job) Result {
	var result int64

	for i := 0; i < 100000; i++ {
		result += int64(job.Value * job.Value + i)
	}

	return Result{
		JobID: job.ID,
		Value: int(result),
	}
}