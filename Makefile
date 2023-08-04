all: initialize download newdata

initialize:
	-mkdir data
	-mkdir tmp

download:
	curl --user-agent "John Keefe - Weather Ball Lamp, john@reallygoodsmarts.nyc" \
	"https://digital.mdl.nws.noaa.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?lat=40.77&lon=-73.98&product=time-series&maxt=maxt&mint=mint&temp=temp&appt=appt&pop12=pop12&wspd=wspd&wgust=wgust&icons=icons&qpf=qpf" \
	-o tmp/nws.xml
	curl --user-agent "John Keefe - Weather Ball Lamp, john@reallygoodsmarts.nyc" \
	"https://api.weather.gov/stations/KNYC/observations" \
	-o tmp/observations.json

newdata:
	node process-nws-data.js
