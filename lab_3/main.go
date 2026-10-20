package main

import(
	"context"
	"fmt"
	"sync"
	"time"
)

func main() {
	config := parseConfig()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	jobs := make(chan Job, config.Buffer)
	results := make(chan Result, config.Buffer)

	startTime := time.Now()

	var workerWG sync.WaitGroup

	workerWG.Add(config.Workers)
	
	for i := 0; i < config.Workers; i++ {
		go func() {
			defer workerWG.Done()
			worker(ctx, jobs, results)
		}()
	}

	go producer(jobs, config.Tasks)

	go func() {
		workerWG.Wait()
		close(results)
	}()

	stats := aggregator(results, startTime)

	fmt.Println("=== Pipeline Statistics ===")
	fmt.Println("Tasks:", config.Tasks)
	fmt.Println("Workers:", config.Workers)
	fmt.Println("Buffer:", config.Buffer)
	fmt.Println("Completed:", stats.CompletedTasks)
	fmt.Println("Total result:", stats.TotalResult)
	fmt.Printf("Time: %.3f ms\n", float64(stats.Duration.Nanoseconds())/1e6)
}