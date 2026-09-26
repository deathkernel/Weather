const state={unit:"C",location:null,weather:null};
const $=id=>document.getElementById(id);
const el={form:$("searchForm"),input:$("cityInput"),loc:$("locationBtn"),unit:$("unitToggle"),status:$("status"),dash:$("dashboard"),date:$("dateLabel"),place:$("locationLabel"),icon:$("conditionIcon"),temp:$("temperature"),tempUnit:$("temperatureUnit"),cond:$("conditionLabel"),feels:$("feelsLike"),hi:$("highTemp"),lo:$("lowTemp"),rain:$("rainChance"),humidity:$("humidity"),wind:$("wind"),clouds:$("clouds"),precip:$("precip"),hourly:$("hourlyForecast"),sunrise:$("sunrise"),sunset:$("sunset"),uv:$("uv"),forecast:$("forecast"),tz:$("timezoneLabel"),hourlyTz:$("hourlyTimezone")};
const API={geo:"https://geocoding-api.open-meteo.com/v1/search",weather:"https://api.open-meteo.com/v1/forecast"};
const WMO={0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Dense drizzle","🌧️"],56:["Freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Slight rain","🌦️"],63:["Moderate rain","🌧️"],65:["Heavy rain","🌧️"],66:["Freezing rain","🌧️"],67:["Heavy freezing rain","🌧️"],71:["Slight snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],77:["Snow grains","❄️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy rain showers","⛈️"],85:["Snow showers","🌨️"],86:["Heavy snow showers","❄️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Thunderstorm with hail","⛈️"]};
const condition=code=>WMO[code]||["Unknown","🌡️"];
function setStatus(text="",error=false){el.status.textContent=text;el.status.classList.toggle("error",error)}
function ft(c){return Math.round(state.unit==="F"?c*9/5+32:c)}
function suffix(){return "°"+state.unit}
function timeLabel(iso){return new Date(iso).toLocaleTimeString([], {hour:"numeric"})}
function dayName(date,i){return i===0?"Today":new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}
function render(){
 const c=state.weather.current,d=state.weather.daily,h=state.weather.hourly;
 const [desc,ic]=condition(c.weather_code);
 el.dash.classList.remove("hidden");
 el.date.textContent=new Date(d.time[0]+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
 el.place.textContent=(state.location.name||"Your location")+(state.location.country_code?", "+state.location.country_code:"");
 el.icon.textContent=ic;el.temp.textContent=ft(c.temperature_2m);el.tempUnit.textContent=suffix();el.cond.textContent=desc;
 el.feels.textContent=ft(c.apparent_temperature)+suffix();el.hi.textContent=ft(d.temperature_2m_max[0])+suffix();el.lo.textContent=ft(d.temperature_2m_min[0])+suffix();
 el.rain.textContent=Math.round(d.precipitation_probability_max[0])+"%";el.humidity.textContent=Math.round(c.relative_humidity_2m)+"%";
 el.wind.textContent=Math.round(c.wind_speed_10m)+" km/h";el.clouds.textContent=Math.round(c.cloud_cover)+"%";el.precip.textContent=Number(c.precipitation||0).toFixed(1)+" mm";
 el.tz.textContent=state.weather.timezone.replaceAll("_"," ");el.hourlyTz.textContent=state.weather.timezone.replaceAll("_"," ");el.unit.textContent=suffix();
 el.sunrise.textContent=timeLabel(d.sunrise[0]);el.sunset.textContent=timeLabel(d.sunset[0]);el.uv.textContent=Number(d.uv_index_max[0]||0).toFixed(1);
 const nowIndex=h.time.findIndex(t=>new Date(t)>=new Date());
 const start=Math.max(0,nowIndex<0?0:nowIndex);
 el.hourly.innerHTML=h.time.slice(start,start+12).map((t,i)=>{const n=start+i;const [,ico]=condition(h.weather_code[n]);return '<div class="hour '+(i===0?"now":"")+'"><span>'+timeLabel(t)+'</span><strong>'+ico+'</strong><b>'+ft(h.temperature_2m[n])+'°</b><small>💧 '+Math.round(h.precipitation_probability[n])+'%</small></div>'}).join("");
 el.forecast.innerHTML=d.time.map((date,i)=>{const [,ico]=condition(d.weather_code[i]);return '<div class="forecast-day '+(i===0?"today":"")+'"><div class="day">'+dayName(date,i)+'</div><div class="emoji">'+ico+'</div><div class="temps"><span>'+ft(d.temperature_2m_max[i])+'°</span><span class="low">'+ft(d.temperature_2m_min[i])+'°</span></div><div class="rain">💧 '+Math.round(d.precipitation_probability_max[i])+'%</div></div>'}).join("");
}
async function loadWeather(location){
 setStatus("Loading live weather…");
 const u=new URL(API.weather);u.searchParams.set("latitude",location.latitude);u.searchParams.set("longitude",location.longitude);u.searchParams.set("timezone","auto");u.searchParams.set("forecast_days","7");
 u.searchParams.set("current","temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m");
 u.searchParams.set("hourly","temperature_2m,precipitation_probability,weather_code");u.searchParams.set("daily","weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max");
 const r=await fetch(u);if(!r.ok)throw Error("Weather service is unavailable right now.");state.location=location;state.weather=await r.json();render();setStatus("Updated just now · "+(location.name||"Your location"));
}
async function searchCity(q){
 setStatus("Finding that location…");const u=new URL(API.geo);u.searchParams.set("name",q);u.searchParams.set("count","1");u.searchParams.set("language","en");
 const r=await fetch(u);if(!r.ok)throw Error("Location search failed.");const data=await r.json();if(!data.results?.length)throw Error("No matching city found.");await loadWeather(data.results[0]);
}
el.form.addEventListener("submit",async e=>{e.preventDefault();try{await searchCity(el.input.value.trim())}catch(err){setStatus(err.message,true)}});
el.loc.addEventListener("click",()=>{if(!navigator.geolocation)return setStatus("Geolocation is not supported.",true);setStatus("Getting your location…");navigator.geolocation.getCurrentPosition(async p=>{try{await loadWeather({name:"Your location",latitude:p.coords.latitude,longitude:p.coords.longitude,country_code:""})}catch(err){setStatus(err.message,true)}},()=>setStatus("Location access was blocked. Search for a city instead.",true),{enableHighAccuracy:true,timeout:10000})});
el.unit.addEventListener("click",()=>{state.unit=state.unit==="C"?"F":"C";render()});
loadWeather({name:"Pune",country_code:"IN",latitude:18.5204,longitude:73.8567}).catch(err=>setStatus(err.message,true));