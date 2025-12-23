import * as fs from 'fs'
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
const FORECAST_URL = `https://api.weather.gov/gridpoints/OKX/33,37/forecast/hourly`
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
                "User-Agent": `(${DOMAIN}, ${EMAIL}@${DOMAIN})` // per nws request
            }
        })
        details_blob = await response.json()
    } catch (error) {
        console.error(`Error fetching detail after retries. Erroring out!`)
        throw error
    }

    return details_blob
}

const parseIcon = (hour) => {

    // example url "https://api.weather.gov/icons/land/night/few?size=small" and we want "few"
    const url = new URL(hour.icon)

    const segments = url.pathname.split("/").filter(Boolean);
    const extractedValue = segments[3]; // ie "few"

    // look for special case of clear/broken skies at night
    const calm_night_icons = [
        "bkn",
        "sct",
        "few",
        "skc"
    ]
    if (segments[2] === "night" && calm_night_icons.includes(extractedValue)) {
        return "n" + extractedValue
    } else {
        return extractedValue
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

    // set the colorful start to get going
    await setWeatherBall(26)

    const forecast = await downloadDetails(FORECAST_URL)

    // get the second periods object, which is the forecast for the next hour
    const hour = forecast.properties.periods[1]
    console.log(hour)

    // get the associated icon
    const icon = parseIcon(hour)
    console.log(icon)

    // get the associated weatherball preset
    const preset = conditions.find(d => d.nws_icons.includes(icon)).ball_id

    await setWeatherBall(preset)
    console.log(`Condition: ${hour.shortForecast}\nIcon: ${icon}\nBall Preset: ${preset}`)
    console.log("Done")

}

main()