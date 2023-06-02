# weather-ball
A desktop lamp that tells you the weather. 

Built during a "play day" with the New York Times Weather Data Team in June 2023.

## Inspiration

Growing up in Minneapolis, I always made sure to spot the Weatherball — a glowing orb atop a bank that foretold the weather.

Reading this [Forgotten Minnesota article](https://forgottenminnesota.com/forgotten-minnesota/2012/03/170) took me back. It's exactly as I remember.

At a glance, you had a sense of what was coming:

```When the Weatherball is glowing red, warmer weather's just ahead. When the Weatherball is shining white, colder weather is in sight. When the Weatherball is wearing green, no weather changes are foreseen. Colors blinking by night and day say, precipitation's on the way.```

(See the [ad on YouTube](https://youtu.be/0E5jcDt9tIM)!)

I've often thought of replicating the Weatherball for myself, and recently had an occaision to do so: At the New York Times I moved to a desk that is near an open counter with power outlets.

## Approach

### Hardware

- An Arduino or Raspberry Pi connected to the internet
- Multicolored LEDs
- A ball lamp of some kind

### Software

I've been a fan of Github Actions for some time, and like the flexibility I have building things I can deploy, tweak and run in the cloud. So for this project I'm going to do the color calculation in a function that is run perodically as a Github Action, posting just the display code someplace on the internet, which the lamp can check.

#### In the cloud

Using a Github Action, I'll get the latest forecast, figure out the appropriate display code, and push that up to an AWS bucket.

The display codes will be `XY` where X is the color and Y is the blinking status:

| Code  |  Display |
|---|---|
|  10 | Red, Steady  |
|  11 | Red, Blinking  |
|  20 | White, Steady  |
|  21 | White, Blinking  |
|  30 | Green, Steady  |
|  31 | Green, Blinking  |

This will be run out of another repository I maintain, called **[bot-house](https://github.com/jkeefe/bot-house)**.

#### On the device

- Hit the endpoint
- Adjust color and blinking accordingly

Resources: 

- https://docs.arduino.cc/retired/shields/arduino-wifi-shield-101
- https://www.arduino.cc/reference/en/libraries/wifi101/
- Followed this: https://docs.arduino.cc/retired/getting-started-guides/ArduinoWiFiShield101
- https://docs.arduino.cc/tutorials/zero/weather-audio-notifier


### Data

The National Weather Service has a couple of APIs — one that's super easy to use and one that's more complicated. For a variety of reasons, I'm more interested in the more complicated one, and have started to play with it in [another project](https://github.com/jkeefe/bot-house/tree/main/bots/weather-box).

So I think I might try that one, falling back to the easier one later if necessary. This is another advantage of having the brains _not_ on the hardware and in a language (nodejs) I'm more comfortable in — I can switch this up as I see fit.



