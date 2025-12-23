SOURCE_URL:="https://api.weather.gov/gridpoints/OKX/33,37/forecast/hourly"

all: initialize download newdata

initialize:
	-mkdir data
	-mkdir tmp

download:
	wget --continue --progress=dot:mega --waitretry=60 ${SOURCE_URL} \
		--header='accept: application/geo+json' \
		--header='User-Agent: (domain.com, myname@domain.com)' \
		-O tmp/download.json

newdata:
	node process-nws-data.js

dltest:
	-mkdir tmp
	wget --continue --progress=dot:mega --waitretry=60 ${SOURCE_URL} \
		--header='accept: application/geo+json' \
		--header='User-Agent: (domain.com, myname@domain.com)' \
		-O tmp/download.json