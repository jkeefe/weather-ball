"""This example fades in and out all of the NeoPixel LEDs."""
from adafruit_circuitplayground import cp
 
while True:
    for x in range(50,255):
        cp.pixels.fill((x, 0, 0))
    for x in range(255,50,-1):
        cp.pixels.fill((x, 0, 0))

