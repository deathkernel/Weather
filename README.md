# SkyCast 🌦️

A modern responsive weather dashboard using public weather APIs with no API key.

## Features

- City search with global geocoding
- Live current temperature and feels-like temperature
- Weather condition and visual icon
- Humidity, wind, cloud cover, precipitation
- 3-day forecast with rain probability
- Hourly forecast
- Sunrise, sunset and UV index
- Celsius / Fahrenheit toggle
- Browser "Use my location" support
- Responsive glass-style UI
- No weather API key required

## Run

Open `index.html` directly, or use a local web server such as VS Code Live Server.

## APIs

SkyCast uses Open-Meteo's public Geocoding API to convert a city name into coordinates. Weather data comes from the public wttr.in JSON API (`format=j1`), which provides current conditions, hourly data and a three-day forecast.

The weather service is public and does not require an API key. Use reasonable request rates.

## Files

```
index.html   UI structure
style.css    responsive visual design
script.js    API integration and dashboard logic
```

## Data attribution

Weather data: wttr.in  
Location search: Open-Meteo Geocoding API
