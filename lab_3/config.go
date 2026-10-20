package main

import "flag"

type Config struct {
	Tasks   int
	Workers int
	Buffer  int
}

func parseConfig() Config {
	tasks := flag.Int("tasks", 100, "number of tasks")
	workers := flag.Int("workers", 4, "number of workers")
	buffer := flag.Int("buffer", 100, "channel buffer size")

	flag.Parse()

	return Config{
		Tasks:   *tasks,
		Workers: *workers,
		Buffer:  *buffer,
	}
}