# SOURCE_URL:="https://api.weather.gov/gridpoints/OKX/33,37/forecast/hourly"
SOURCE_URL:='https://digital.mdl.nws.noaa.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?lat=40.77&lon=-73.98&product=time-series&maxt=maxt&mint=mint&temp=temp&appt=appt&pop12=pop12&wspd=wspd&wgust=wgust&icons=icons&qpf=qpf'

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
		--header='User-Agent: (John Keefe - Weather Ball Lamp, weather@reallygoodsmarts.nyc)' \
		-O tmp/download.json