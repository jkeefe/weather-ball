# weather-ball
A desktop lamp that tells you the weather. 

Built during a "play day" with the New York Times Weather Data Team in June 2023.

## Inspiration

Growing up in Minneapolis, I always made sure to spot the Weatherball — a glowing orb atop a bank that foretold the weather.

Reading this [Forgotten Minnesota article](https://forgottenminnesota.com/forgotten-minnesota/2012/03/170) took me back. It's exactly as I remember.

At a glance, you had a sense of what was coming:

```
When the Weatherball is glowing red, warmer weather's just ahead. When the Weatherball is shining white, colder weather is in sight. When the Weatherball is wearing green, no weather changes are foreseen. Colors blinking by night and day say, precipitation's on the way.
```

(See the [ad on YouTube](https://youtu.be/0E5jcDt9tIM)!)

I've often thought of replicating the Weatherball for myself, and recently had an occaision to do so: At the New York Times I moved to a desk that is near an open counter with power outlets.

## Approach

Initially I planned to wire up an internet-connected Arduino that would hit a public JSON file I'd update with Github Actions. But I soon discovered that conneting Arduinos to the internet remains a hassle, so after some false starts I opted for a Raspberry Pi running nodejs ... and doing all the calculations on board

### Hardware

- A Raspberry Pi connected to the internet and running node
- Multicolored LEDs (RGB)
- A ball lamp of some kind

## Data

The National Weather Service has a couple of APIs — one that's super easy to use and one that's more complicated. For a variety of reasons, I'm more interested in the more complicated one, and have started to play with it in [another project](https://github.com/jkeefe/bot-house/tree/main/bots/weather-box).

[Instructions for that API are here](https://digital.mdl.nws.noaa.gov/xml/).

So I think I might try that one, falling back to the easier one later if necessary. 

[List of data fields available](https://digital.mdl.nws.noaa.gov/xml/docs/elementInputNames.php) (to include in the URL). Use like this: `&pop12=pop12`

## Building

### Prepping the Pi

- To prepare the Raspberry Pi and install nodejs, I used [this great guide](https://thisdavej.com/beginners-guide-to-installing-node-js-on-a-raspberry-pi/), though I omitted several steps:
    - **Apply Raspberry Pi OS Updates**, because I did it in the setup wizard
    - **Prepare for Remote VNC Connections**, though I did install Samba in this section so I could address (and ssh into) my pi as raspi.local instead of an ip address, which is pretty great. I'm using SSH instead of VNC to controll my pi.
    - **Create Windows File Share on the Pi (Optional)**, I'm using a Mac.

I'm also going to use [`perf-gpio`](https://www.npmjs.com/package/perf-gpio) to control the pins on the Pi, especially to fade the ball in and out when it is "flashing."

To get the code onto the pi, I'm pulling it down from Github using https, so I don't need a key on the pi. I won't be able to push up from the device, but that's okay.

## Colors and timing

According to [Forgotten Minnesota](https://forgottenminnesota.com/forgotten-minnesota/2012/03/170), "In its early days, the National Weather Service would call the bank each day at 4:14 p.m. to have a bank employee set the color of the Weatherball." So I'm going to make that switch every day at that time:

![IMG_5974](https://github.com/jkeefe/weather-ball/assets/312347/fc52b54d-59ac-4f5b-b9a1-17aad67d9e40)

- 12 a.m. to 4:14 p.m. Eastern
    - Temperature (warmer, cooler, same)
        - Today's forecast, from NWS XML system vs.
        - Yesterday's highest observation, from the NWS API: https://api.weather.gov/stations/KNYC/observations
    - Precipitation 
        - QPF of 0.5" or more any time before 8 p.m. today

- 4:14 p.m. to 11:59 p.m. Eastern
    - Temperature (warmer, cooler, same)
        - Tomorrow's forecast, from NWS XML system vs.
        - Todays's highest observation, from the NWS API: https://api.weather.gov/stations/KNYC/observations
    - Precipitation 
        - QPF of 0.5" or more any time between 8 a.m. and 8 p.m. tomorrow



### Using Johnny-Five & Node-pixel

Originally, I was going to use a Circuit Playground Board as the display board and a Raspberry Pi as the controller (the main reason: I need access to wifi and the internet to get the data).

BUT, the LEDs on board the Circuit Playground aren't great for lighting up my whole globe. Also it's a little bit of overkill: The CP boards have so many great sensors on them ... seems a waste to just use them for the LEDs.

Instead, I'm going to run a bunh of LEDs off an Arduino and control the Arduino via NodeJS on the Rasberry Pi, using [this great documentation as an example](https://chrisruppel.com/blog/arduino-johnny-five-neopixel/).


### Another possibility: ESP32C3

I could also use this ridiculously cheap [Seedstudio ESP32C3 board](https://www.seeedstudio.com/Seeed-XIAO-ESP32C3-p-5431.html). 

It'd take a bit more work. Maybe not worth the hassle. But the code to make is happen is collected [on these pages](https://pinboard.in/search/u:jkeefe?query=ESP32C3).

### New possibiilty: Rasberry Pi & ESP32 with WLED

Currently envisioning the ball running WLED, with animation presets I've established and tested to work perfectly for various conditions, including rain, wamer, colder, snow, storms, wind, sunny, temperate, super cold, etc.

These would be run on an ESP32 (or ESP32C3 maybe).

The Raspberry Pi would be responsible for:

- Running NodeJS
- Connecting to the internet
- Getting the weather
- Making a determinaiton about what preset to use
- Sending that preset to the ESP32 using the JSON API over a serial connection — quite possibly just the USB cable

#### A wired connection

Making the serial connection would happen either over USB or the TX/RX pins. There's a great writeup of how to do that [here](https://data.engrie.be/ESP32/ESP32_-_Part_12_-_ESP32_meets_Raspberry_Pi.pdf), which I've also saved as a PDF.

#### Serial on the PI

The full install instructions, including the Pi formatting, are [here](https://github.com/nebrius/raspi-io/wiki/Getting-a-Raspberry-Pi-ready-for-NodeBots). Seems like there may be some quirks that require a reformatting. Also handles adding Node, so that's good.

I'd take this to the `node-serialport` point.

Node Serialport [installation notes](https://serialport.io/docs/guide-installation#raspberry-pi-linux) have additional info, and using Node Serialport is [here](https://serialport.io/docs/guide-usage). There's also info about parsers and thigns.

#### WLED serial

It looks like [this comment](https://wled.discourse.group/t/serial-wired-api/3998/5) has the clearest info:

```
It is working, WLED accepts the following ASCII string over RX pin “’{“on”:“t”,“v”:true}’” @ 115200 bits per second (I could not figure out how to change baudrate but that’s OK for me).
```

More on the serial connection is available in [the WLED docs](https://kno.wled.ge/interfaces/serial/). Including:

```
If GPIO3 is allocated (e.g. for LED output), all Serial functionality except debug output is unavailable.

If GPIO1 is allocated, all Serial output is disabled, including the JSON API response, Improv, and tpm2 output.
```

We're going to want the **JSON over Serial** part of these docs.

#### WLED API

I should be able to [set new values](https://kno.wled.ge/interfaces/json-api/#setting-new-values) through the JSON API. The one we'll want, after the presets have been set, is `{"ps": x}`, where x is a preset number from -1 to 250.



