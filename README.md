# SkyCast 🌦️

A modern responsive weather dashboard powered by the public Open-Meteo API.

## Features

- City search with global geocoding
- Live current temperature and feels-like temperature
- Weather condition and visual icon
- Humidity, wind, cloud cover, precipitation
- 7-day forecast with rain probability
- Celsius / Fahrenheit toggle
- Browser "Use my location" support
- Responsive glass-style UI
- No API key required for non-commercial Open-Meteo usage

## Run

Open `index.html` directly, or use a local web server such as VS Code Live Server.

## API

SkyCast uses Open-Meteo's Geocoding API to convert a city name into coordinates, then its Forecast API for current and daily weather data. Open-Meteo documents JSON HTTP GET endpoints and no authentication requirement for non-commercial use.

Weather data attribution is provided in the app footer.

## Files

```
index.html   UI structure
style.css    responsive visual design
script.js    API integration and dashboard logic
```
