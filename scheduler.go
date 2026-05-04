package alps

import (
	"sync"
	"time"
)

// JobFunc is a function that performs a background task.
type JobFunc func() error

// Scheduler manages periodic background jobs.
type Scheduler struct {
	mu       sync.Mutex
	jobs     map[string]JobFunc
	interval time.Duration
	stop     chan struct{}
}

// NewScheduler creates a new job scheduler with the given tick interval.
func NewScheduler(interval time.Duration) *Scheduler {
	return &Scheduler{
		jobs:     make(map[string]JobFunc),
		interval: interval,
		stop:     make(chan struct{}),
	}
}

// Register adds a new job to the scheduler.
func (s *Scheduler) Register(name string, job JobFunc) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[name] = job
}

// Clear removes all registered jobs.
func (s *Scheduler) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs = make(map[string]JobFunc)
}

// Start runs the scheduler loop in a background goroutine.
func (s *Scheduler) Start(logger Logger) {
	ticker := time.NewTicker(s.interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				s.mu.Lock()
				// Copy jobs to avoid holding the lock during execution
				jobs := make(map[string]JobFunc, len(s.jobs))
				for name, job := range s.jobs {
					jobs[name] = job
				}
				s.mu.Unlock()

				for name, job := range jobs {
					logger.Debugf("Scheduler running job: %s", name)
					if err := job(); err != nil {
						logger.Errorf("Scheduler job '%s' error: %v", name, err)
					} else {
						logger.Debugf("Scheduler job completed: %s", name)
					}
				}
			case <-s.stop:
				ticker.Stop()
				return
			}
		}
	}()
}

// Stop halts the scheduler loop.
func (s *Scheduler) Stop() {
	close(s.stop)
}
