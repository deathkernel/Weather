# SkyCast 🌦️

A modern responsive weather dashboard using public weather services with no weather API key.

## Features

- City search with global geocoding
- Live current temperature and feels-like temperature
- Weather condition and visual icon
- Humidity, wind, cloud cover and precipitation
- Hourly forecast
- 3-day forecast with rain probability
- Sunrise, sunset and UV index
- Celsius / Fahrenheit toggle
- Browser "Use my location" support
- IQAir air-quality panel with AQI, PM2.5 and main pollutant when an IQAir key is configured
- Responsive glass-style UI

## Run

Open `index.html` directly, or use a local web server such as VS Code Live Server.

## APIs

### Weather

SkyCast uses the public wttr.in JSON API (`format=j1`) for current conditions, hourly data and the three-day forecast.

### Location search

Open-Meteo's public Geocoding API converts city names into coordinates.

### Air quality

SkyCast optionally uses the IQAir AirVisual API for city-level real-time air-quality data. IQAir currently offers a free Community API plan, but it requires a free API key. The Community plan is limited to 5 calls/minute, 500/day and 10,000/month.

Paste your IQAir key into the **IQAir** panel and click **Save key**. The key is stored only in your browser's local storage.

Create a key from your IQAir dashboard:
https://dashboard.iqair.com/

## Files

```
index.html   UI structure
style.css    responsive visual design
script.js    API integration and dashboard logic
```

## Attribution

Weather: wttr.in  
Location search: Open-Meteo Geocoding API  
Air quality: IQAir AirVisual API
