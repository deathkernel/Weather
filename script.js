const state={unit:"C",location:null,weather:null,air:null};
const $=id=>document.getElementById(id);
const el={form:$("searchForm"),input:$("cityInput"),loc:$("locationBtn"),unit:$("unitToggle"),status:$("status"),dash:$("dashboard"),date:$("dateLabel"),place:$("locationLabel"),icon:$("conditionIcon"),temp:$("temperature"),tempUnit:$("temperatureUnit"),cond:$("conditionLabel"),feels:$("feelsLike"),hi:$("highTemp"),lo:$("lowTemp"),rain:$("rainChance"),humidity:$("humidity"),wind:$("wind"),clouds:$("clouds"),precip:$("precip"),hourly:$("hourlyForecast"),sunrise:$("sunrise"),sunset:$("sunset"),uv:$("uv"),forecast:$("forecast"),tz:$("timezoneLabel"),hourlyTz:$("hourlyTimezone"),aqiValue:$("aqiValue"),aqiLabel:$("aqiLabel"),pm25:$("pm25"),mainPollutant:$("mainPollutant"),airStation:$("airStation"),airSource:$("airSource"),iqairKey:$("iqairKey"),saveIqairKey:$("saveIqairKey")};

const API={geo:"https://geocoding-api.open-meteo.com/v1/search",weather:"https://wttr.in",iqair:"https://api.airvisual.com/v2/nearest_city",proxy:"https://api.allorigins.win/raw?url="};
const storedKey=localStorage.getItem("skycast_iqair_key");if(storedKey)el.iqairKey.value=storedKey;

const condition=(desc="")=>{
  const d=String(desc).toLowerCase();
  if(d.includes("thunder"))return["Thunderstorm","⛈️"];
  if(d.includes("snow")||d.includes("blizzard")||d.includes("sleet"))return["Snow","❄️"];
  if(d.includes("rain")||d.includes("drizzle"))return["Rain","🌧️"];
  if(d.includes("fog")||d.includes("mist"))return["Fog","🌫️"];
  if(d.includes("overcast"))return["Overcast","☁️"];
  if(d.includes("cloud"))return["Partly cloudy","⛅"];
  if(d.includes("sun")||d.includes("clear"))return["Clear sky","☀️"];
  return[desc||"Weather","🌡️"];
};
const setStatus=(text="",error=false)=>{el.status.textContent=text;el.status.classList.toggle("error",error)};
const ft=c=>Math.round(state.unit==="F"?Number(c)*9/5+32:Number(c));
const suffix=()=>"°"+state.unit;
const timeLabel=s=>new Date(s).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
const formatHour=t=>{const n=String(t).padStart(4,"0");return n.slice(0,2)+":"+n.slice(2)};
const formatDay=s=>new Date(s).toLocaleDateString(undefined,{weekday:"short"});

function render(){
  const current=state.weather.current_condition?.[0],days=state.weather.weather||[];
  if(!current||!days.length)throw Error("Weather response was incomplete.");
  const pair=condition(current.weatherDesc?.[0]?.value||"Weather"),today=days[0],astro=today.astronomy?.[0];
  el.dash.classList.remove("hidden");el.date.textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  el.place.textContent=(state.location.name||"Your location")+(state.location.country_code?", "+state.location.country_code:"");
  el.icon.textContent=pair[1];el.temp.textContent=ft(current.temp_C);el.tempUnit.textContent=suffix();el.cond.textContent=pair[0];
  el.feels.textContent=ft(current.FeelsLikeC)+suffix();el.hi.textContent=ft(today.maxtempC)+suffix();el.lo.textContent=ft(today.mintempC)+suffix();
  el.rain.textContent=(Number(current.chanceofrain)||0)+"%";el.humidity.textContent=(Number(current.humidity)||0)+"%";
  el.wind.textContent=(Number(current.windspeedKmph)||0)+" km/h";el.clouds.textContent=(Number(current.cloudcover)||0)+"%";el.precip.textContent=(Number(current.precipMM)||0).toFixed(1)+" mm";
  el.tz.textContent="Local time";el.hourlyTz.textContent="Local time";el.unit.textContent=suffix();
  el.sunrise.textContent=astro?.sunrise||"—";el.sunset.textContent=astro?.sunset||"—";el.uv.textContent=astro?.uvIndex||current.uvIndex||"—";
  const hourly=days.flatMap(day=>day.hourly||[]).slice(0,12);
  el.hourly.innerHTML=hourly.map((h,i)=>'<div class="hour '+(i===0?"now":"")+'"><span>'+formatHour(h.time)+'</span><strong>'+condition(h.weatherDesc?.[0]?.value||"Weather")[1]+'</strong><b>'+ft(h.tempC)+'°</b><small>💧 '+(Number(h.chanceofrain)||0)+'%</small></div>').join("");
  el.forecast.innerHTML=days.slice(0,3).map((day,i)=>{
    const desc=day.hourly?.[4]?.weatherDesc?.[0]?.value||day.hourly?.[0]?.weatherDesc?.[0]?.value||"Weather";
    const rain=Math.max(0,...(day.hourly||[]).map(h=>Number(h.chanceofrain)||0));
    return '<div class="forecast-day '+(i===0?"today":"")+'"><div class="day">'+(i===0?"Today":formatDay(day.date))+'</div><div class="emoji">'+condition(desc)[1]+'</div><div class="temps"><span>'+ft(day.maxtempC)+'°</span><span class="low">'+ft(day.mintempC)+'°</span></div><div class="rain">💧 '+rain+'%</div></div>';
  }).join("");
  renderAir();
}

function renderAir(){
  if(!state.air){el.aqiValue.textContent="—";el.aqiLabel.textContent="AQI";el.pm25.textContent="—";el.mainPollutant.textContent="—";el.airStation.textContent="Add IQAir key";el.airSource.textContent="Awaiting key";return}
  const p=state.air.current?.pollution||{},aqi=p.aqius??p.aqicn;
  el.aqiValue.textContent=aqi??"—";el.aqiLabel.textContent=p.aqius!=null?"US AQI":"AQI";
  el.pm25.textContent=p.aqius!=null?(p.p2!=null?p.p2+" µg/m³":"—"):"Available with paid plan";
  el.mainPollutant.textContent=p.mainus||p.maincn||"—";
  el.airStation.textContent=state.air.city||"Nearest city";el.airSource.textContent="IQAir";
}

async function requestJson(url){
  try{const r=await fetch(url);if(!r.ok)throw Error("direct");return await r.json()}
  catch{const r=await fetch(API.proxy+encodeURIComponent(url));if(!r.ok)throw Error("proxy");return await r.json()}
}

async function loadAirQuality(location){
  const key=localStorage.getItem("skycast_iqair_key")||el.iqairKey.value.trim();
  if(!key){state.air=null;renderAir();return}
  try{
    const u=new URL(API.iqair);u.searchParams.set("lat",Number(location.latitude).toFixed(4));u.searchParams.set("lon",Number(location.longitude).toFixed(4));u.searchParams.set("key",key);
    const data=await requestJson(u);
    if(data.status!=="success")throw Error(data.data?.message||"IQAir request failed.");
    state.air=data.data;renderAir();
  }catch(err){
    state.air=null;renderAir();el.airSource.textContent="IQAir error";el.airStation.textContent=err.message||"Check API key";
  }
}

async function loadWeather(location){
  setStatus("Loading live weather…");
  const u=new URL(location.latitude+","+location.longitude,API.weather+"/");u.searchParams.set("format","j1");u.searchParams.set("lang","en");
  state.location=location;state.weather=await requestJson(u);render();await loadAirQuality(location);
  setStatus("Updated just now · "+(location.name||"Your location"));
}

async function searchCity(q){
  setStatus("Finding that location…");const u=new URL(API.geo);u.searchParams.set("name",q);u.searchParams.set("count","1");u.searchParams.set("language","en");
  const r=await fetch(u);if(!r.ok)throw Error("Location search failed.");
  const data=await r.json();if(!data.results?.length)throw Error("No matching city found.");await loadWeather(data.results[0]);
}

el.saveIqairKey.addEventListener("click",async()=>{const key=el.iqairKey.value.trim();if(!key){localStorage.removeItem("skycast_iqair_key");state.air=null;renderAir();return setStatus("IQAir key removed.")}localStorage.setItem("skycast_iqair_key",key);if(state.location){setStatus("Loading IQAir data…");await loadAirQuality(state.location);setStatus("IQAir key saved.")}});
el.form.addEventListener("submit",async e=>{e.preventDefault();try{await searchCity(el.input.value.trim())}catch(err){setStatus(err.message,true)}});
el.loc.addEventListener("click",()=>{if(!navigator.geolocation)return setStatus("Geolocation is not supported.",true);setStatus("Getting your location…");navigator.geolocation.getCurrentPosition(async p=>{try{await loadWeather({name:"Your location",latitude:p.coords.latitude,longitude:p.coords.longitude,country_code:""})}catch(err){setStatus(err.message,true)}},()=>setStatus("Location access was blocked. Search for a city instead.",true),{enableHighAccuracy:true,timeout:10000})});
el.unit.addEventListener("click",()=>{state.unit=state.unit==="C"?"F":"C";render()});
loadWeather({name:"Pune",country_code:"IN",latitude:18.5204,longitude:73.8567}).catch(err=>setStatus(err.message,true));