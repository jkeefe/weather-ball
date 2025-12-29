import * as convert from 'xml-js'
import { SerialPort } from 'serialport'
import { conditions } from './resources/conditions.js'
import fetchRetry from 'fetch-retry'

// great add-in to allow retries and back-off
// fetch-retry modifies the node fetch API
const fetch = fetchRetry(global.fetch, {
    retries: 4,
    retryDelay: function (attempt, error, response) {
        return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000, 8000
    }
    // retryDelay: 2000 // 2 seconds
});

// set the serial port
const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 })

// constants
// const FORECAST_URL = `https://api.weather.gov/gridpoints/OKX/33,37/forecast/hourly`
const FORECAST_URL = `https://digital.mdl.nws.noaa.gov/xml/sample_products/browser_interface/ndfdXMLclient.php?lat=40.77&lon=-73.98&product=time-series&icons=icons`
const DOMAIN = "reallygoodsmarts.nyc"
const EMAIL = "weather"


/// operational functions 

const downloadDetails = async (url) => {

    var details_blob

    // get the quake detail file from usgs
    console.log(`Grabbing hourly detail from ${url}`)
    try {
        const response = await fetch(url, {
            headers: {
                "Acccept": "application/geo+json",
                "User-Agent": `(${DOMAIN}, ${EMAIL}@${DOMAIN})`, // per nws request
                "Cache-Control": "must-revalidate"
            }
        })
        details_blob = await response.text()
    } catch (error) {
        console.error(`Error fetching detail after retries. Erroring out!`)
        throw error
    }

    return details_blob
}

const parseData = (xml) => {
    // a universal weather.gov xml forecast parser
    var result = convert.xml2js(xml, { compact: false });
    var parsed = {}

    // drill to the base data
    const data = result.elements[0].elements.find(d => d.name == "data")

    // get the time layouts
    const time_layouts = data.elements.filter(d => d.name == "time-layout")

    // get the weather data
    const weather = data.elements.find(d => d.name == "parameters")

    // loop through the time layouts and populate them with the corresponding data from elsewhere
    for (var layout of time_layouts) {

        // establish the block as a key
        const layout_name = layout.elements.filter(d => d.name == "layout-key")[0].elements[0].text
        parsed[layout_name] = []

        // get all the valid times in the layout
        const start_valid_times = layout.elements.filter(d => d.name == "start-valid-time")
        const end_valid_times = layout.elements.filter(d => d.name == "end-valid-time")

        // go get any weather data that uses this time layout
        const weather_sets = weather.elements.filter(d => d.attributes["time-layout"] == layout_name)

        // then loop through the the start times to build the time blocks
        for (let index in start_valid_times) {

            const block = {
                valid_start: start_valid_times[index].elements[0].text
            }

            // some layouts don't have end valid times!
            if (end_valid_times.length > 0) {
                block.valid_end = end_valid_times[index].elements[0].text
            }

            // loop through the weather sets matching this layout
            // and pluck the corresponding index value

            for (let weather_set of weather_sets) {


                var key_name = (weather_set.attributes.type) ? weather_set.name + "_" + weather_set.attributes.type : weather_set.name
                key_name = key_name.replaceAll(" ", "_").replaceAll("-", "_")

                // get the weather values, 
                // but handle conditions-icon differently
                var weather_values
                if (weather_set.name == "conditions-icon") {
                    key_name = weather_set.name
                    weather_values = weather_set.elements.filter(d => d.name == "icon-link")
                } else {
                    // just use the value
                    weather_values = weather_set.elements.filter(d => d.name == "value")
                }

                // console.log(JSON.stringify(weather_values, null, 2))

                // add this value to the block at the same index as the valid times
                block[key_name] = weather_values[index].elements[0].text

            }

            parsed[layout_name].push(block)

        }



    }

    // console.log(JSON.stringify(parsed, null, 2))

    return parsed
}

const parseIcon = (hour) => {

    // example url "http://forecast.weather.gov/images/wtf/nra70.jpg" and we want "nra"
    const url = new URL(hour["conditions-icon"])

    const segments = url.pathname.split("/").filter(Boolean);
    const extractedValue = segments[2]; // => "nra70.jpg"

    const regex = /^([a-zA-Z]+)\d+\.jpg$/;
    const match = extractedValue.match(regex); // = "nra"

    if (match) {
        return match[1]
    } else {
        return null
    }
}

const setWeatherBall = async (preset) => {

    // send the WLED preset to the weather ball over serial
    port.write(`{"ps": ${preset}}`, function (err) {
        if (err) {
            return console.log('Error writing to weather ball: ', err.message)
        }
        console.log(`Serial message with preset ${preset} written to weather ball.`)
    })

    // Open errors will be emitted as an error event
    port.on('error', function (err) {
        console.log('Error: ', err.message)
    })

}


const main = async () => {

    const forecast = await downloadDetails(FORECAST_URL)

    // parse the xml
    const parsed = parseData(forecast)
    console.log(JSON.stringify(parsed, null, 2))


    // get the second forecast object, which will always be the forecast for the next hour
    const hour = parsed["k-p1h-n64-1"][0]
    console.log("Using hour data:", hour)

    // get the associated icon
    const icon = parseIcon(hour)

    // get the associated weatherball preset
    let preset = conditions.find(d => d.nws_icons.includes(icon)).ball_id

    if (!preset) { preset = 26 }

    await setWeatherBall(preset)
    console.log(`Icon: ${icon}\nBall Preset: ${preset}`)
    console.log("Done")

}

main()