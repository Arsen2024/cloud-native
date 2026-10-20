package main

func producer(jobs chan<- Job, tasks int) {
	for i := 1; i <= tasks; i++ {
		job := Job{
			ID:    i,
			Value: i,
		}

		jobs <- job
	}

	close(jobs)
}