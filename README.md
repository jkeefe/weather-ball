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

## Colors and timing

According to [Forgotten Minnesota](https://forgottenminnesota.com/forgotten-minnesota/2012/03/170), "In its early days, the National Weather Service would call the bank each day at 4:14 p.m. to have a bank employee set the color of the Weatherball." So I'm going to make that switch every day at that time:

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








