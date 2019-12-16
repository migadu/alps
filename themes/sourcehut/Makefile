SRHT_PATH?=/usr/lib/python3.8/site-packages/srht

assets/style.css: scss/*.scss ${SRHT_PATH}/scss/*.scss
	@mkdir -p assets/
	sassc -I${SRHT_PATH}/scss scss/main.scss $@

all: assets/style.css

.DEFAULT_GOAL=all
