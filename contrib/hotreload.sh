#!/bin/sh

# Watch themes and plugins files, automatically reload koushin on change.

events=modify,create,delete,move
targets="themes/ plugins/"

inotifywait -e "$events" -m -r $targets | while read line; do
	jobs
	if [ -z "$(jobs -p)" ]; then
		(sleep 0.5 && pkill -USR1 koushin) &
	fi
done
