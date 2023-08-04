import * as fs from 'fs'
import * as convert from 'xml-js'

import dayjs from 'dayjs';
//  in case of module not found errors, try adding .js to end of filenames below
import updateLocale from 'dayjs/plugin/updateLocale.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// set up the as-of date
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/New_York");
dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
    monthsShort: [
        "Jan.",
        "Feb.",
        "March",
        "April",
        "May",
        "June",
        "July",
        "Aug.",
        "Sept.",
        "Oct.",
        "Nov.",
        "Dec."
    ],
    meridiem: (hour, minute, isLowercase) => (hour >= 12 ? "pm" : "am")
});

const getHour = time => {
    return dayjs
        .unix(time)
        .tz("America/New_York")
        .format("h a");
};


/// operational functions 


const getData = async (filename) => {

    let data = fs.readFileSync(filename, { encoding: 'utf-8' });
    return data

}

const parseData = (xml) => {
    var result = convert.xml2js(xml, { compact: false });
    var parsed = {}

    // drill to the base data
    const data = result.elements[0].elements.find(d => d.name == "data")

    // get the time layouts
    const time_layouts = data.elements.filter(d => d.name == "time-layout")

    // get the weather data
    const weather = data.elements.find(d => d.name == "parameters")

    // console.log(JSON.stringify(weather, null, 2))

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

    console.log(JSON.stringify(parsed, null, 2))

    return parsed
}

const writeData = (data) => {
    // console.log(JSON.stringify(data, null, 2))
    fs.writeFileSync('data/latest.json', JSON.stringify(data));
    return true
}

const main = () => {

    getData("tmp/nws.xml")
        .then(parseData)
        // .then(formatData)
        .then(writeData)
        .catch(err => {
            console.error(err)
        })


}

main()