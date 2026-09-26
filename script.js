const state = { unit: "C", location: null, weather: null };

const $ = (id) => document.getElementById(id);

const el = {
  form: $("searchForm"),
  input: $("cityInput"),
  loc: $("locationBtn"),
  unit: $("unitToggle"),
  status: $("status"),
  dash: $("dashboard"),
  date: $("dateLabel"),
  place: $("locationLabel"),
  icon: $("conditionIcon"),
  temp: $("temperature"),
  tempUnit: $("temperatureUnit"),
  cond: $("conditionLabel"),
  feels: $("feelsLike"),
  hi: $("highTemp"),
  lo: $("lowTemp"),
  rain: $("rainChance"),
  humidity: $("humidity"),
  wind: $("wind"),
  clouds: $("clouds"),
  precip: $("precip"),
  forecast: $("forecast"),
  tz: $("timezoneLabel")
};

const API = {
  geo: "https://geocoding-api.open-meteo.com/v1/search",
  weather: "https://api.open-meteo.com/v1/forecast"
};

const WMO = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"], 45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"], 63: ["Moderate rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Heavy freezing rain", "🌧️"],
  71: ["Slight snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"], 80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"],
  82: ["Heavy rain showers", "⛈️"], 85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};

const getCondition = (code) => WMO[code] || ["Unknown", "🌡️"];

function setStatus(text = "", error = false) {
  el.status.textContent = text;
  el.status.classList.toggle("error", error);
}

function formatTemp(celsius) {
  return Math.round(state.unit === "F" ? celsius * 9 / 5 + 32 : celsius);
}

function suffix() {
  return "°" + state.unit;
}

function dayName(date, index) {
  if (index === 0) return "Today";
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

function render() {
  const current = state.weather.current;
  const daily = state.weather.daily;
  const [description, icon] = getCondition(current.weather_code);

  el.dash.classList.remove("hidden");
  el.date.textContent = new Date(daily.time[0] + "T12:00:00")
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  el.place.textContent = (state.location.name || "Your location") +
    (state.location.country_code ? ", " + state.location.country_code : "");

  el.icon.textContent = icon;
  el.temp.textContent = formatTemp(current.temperature_2m);
  el.tempUnit.textContent = suffix();
  el.cond.textContent = description;
  el.feels.textContent = formatTemp(current.apparent_temperature) + suffix();
  el.hi.textContent = formatTemp(daily.temperature_2m_max[0]) + suffix();
  el.lo.textContent = formatTemp(daily.temperature_2m_min[0]) + suffix();
  el.rain.textContent = Math.round(daily.precipitation_probability_max[0]) + "%";
  el.humidity.textContent = Math.round(current.relative_humidity_2m) + "%";
  el.wind.textContent = Math.round(current.wind_speed_10m) + " km/h";
  el.clouds.textContent = Math.round(current.cloud_cover) + "%";
  el.precip.textContent = Number(current.precipitation || 0).toFixed(1) + " mm";
  el.tz.textContent = state.weather.timezone.replaceAll("_", " ");
  el.unit.textContent = suffix();

  el.forecast.innerHTML = daily.time.map((date, index) => {
    const [, forecastIcon] = getCondition(daily.weather_code[index]);
    return [
      '<div class="forecast-day ' + (index === 0 ? "today" : "") + '">',
      '<div class="day">' + dayName(date, index) + "</div>",
      '<div class="emoji">' + forecastIcon + "</div>",
      '<div class="temps"><span>' + formatTemp(daily.temperature_2m_max[index]) +
        '°</span><span class="low">' + formatTemp(daily.temperature_2m_min[index]) + "°</span></div>",
      '<div class="rain">💧 ' + Math.round(daily.precipitation_probability_max[index]) + "%</div>",
      "</div>"
    ].join("");
  }).join("");
}

async function loadWeather(location) {
  setStatus("Loading live weather…");

  const url = new URL(API.weather);
  url.searchParams.set("latitude", location.latitude);
  url.searchParams.set("longitude", location.longitude);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  );

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather service is unavailable right now.");

  state.location = location;
  state.weather = await response.json();

  render();
  setStatus("Updated just now · " + (location.name || "Your location"));
}

async function searchCity(query) {
  setStatus("Finding that location…");

  const url = new URL(API.geo);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Location search failed.");

  const data = await response.json();
  if (!data.results || !data.results.length) throw new Error("No matching city found.");

  await loadWeather(data.results[0]);
}

el.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = el.input.value.trim();
  if (!query) return;

  try {
    await searchCity(query);
  } catch (error) {
    setStatus(error.message, true);
  }
});

el.loc.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported.", true);
    return;
  }

  setStatus("Getting your location…");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await loadWeather({
          name: "Your location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          country_code: ""
        });
      } catch (error) {
        setStatus(error.message, true);
      }
    },
    () => setStatus("Location access was blocked. Search for a city instead.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

el.unit.addEventListener("click", () => {
  state.unit = state.unit === "C" ? "F" : "C";
  render();
});

loadWeather({
  name: "Pune",
  country_code: "IN",
  latitude: 18.5204,
  longitude: 73.8567
}).catch((error) => setStatus(error.message, true));