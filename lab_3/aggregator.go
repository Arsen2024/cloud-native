package main

import "time"

type Statistics struct {
	CompletedTasks int
	TotalResult    int64
	Duration       time.Duration
}

func aggregator(results <-chan Result, startTime time.Time) Statistics {
	var completedTasks int
	var totalResult int64

	for result := range results {
		completedTasks++
		totalResult += int64(result.Value)
	}

	return Statistics{
		CompletedTasks: completedTasks,
		TotalResult:    totalResult,
		Duration:       time.Since(startTime),
	}
}