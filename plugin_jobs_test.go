package alps

import "testing"

func TestDisabledPluginDoesNotScheduleJobs(t *testing.T) {
	old := pluginLoaders
	t.Cleanup(func() { pluginLoaders = old })
	p := GoPlugin{Name: "disabled"}
	p.AddJob("job", func() error { return nil })
	pluginLoaders = []PluginLoaderFunc{p.Loader()}
	s := &Server{logger: &NilLogger{}, Options: &Options{EnabledPlugins: []string{"base"}}, Scheduler: NewScheduler(1)}
	if err := s.loadPlugins(); err != nil {
		t.Fatal(err)
	}
	if _, ok := s.Scheduler.jobs["disabled:job"]; ok {
		t.Fatal("disabled job was registered")
	}
}
