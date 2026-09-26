const state={unit:"C",location:null,weather:null};
const $=id=>document.getElementById(id);
const el={form:$("searchForm"),input:$("cityInput"),loc:$("locationBtn"),unit:$("unitToggle"),status:$("status"),dash:$("dashboard"),date:$("dateLabel"),place:$("locationLabel"),icon:$("conditionIcon"),temp:$("temperature"),tempUnit:$("temperatureUnit"),cond:$("conditionLabel"),feels:$("feelsLike"),hi:$("highTemp"),lo:$("lowTemp"),rain:$("rainChance"),humidity:$("humidity"),wind:$("wind"),clouds:$("clouds"),precip:$("precip"),hourly:$("hourlyForecast"),sunrise:$("sunrise"),sunset:$("sunset"),uv:$("uv"),forecast:$("forecast"),tz:$("timezoneLabel"),hourlyTz:$("hourlyTimezone")};

const API={geo:"https://geocoding-api.open-meteo.com/v1/search",weather:"https://wttr.in",proxy:"https://api.allorigins.win/raw?url="};

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
  const current=state.weather.current_condition?.[0];
  const days=state.weather.weather||[];
  if(!current||!days.length)throw Error("Weather response was incomplete.");
  const pair=condition(current.weatherDesc?.[0]?.value||"Weather");
  const today=days[0],astro=today.astronomy?.[0];
  el.dash.classList.remove("hidden");
  el.date.textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
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
    const symbol=day.hourly?.[4]?.weatherDesc?.[0]?.value||day.hourly?.[0]?.weatherDesc?.[0]?.value||"Weather";
    const rain=Math.max(0,...(day.hourly||[]).map(h=>Number(h.chanceofrain)||0));
    return '<div class="forecast-day '+(i===0?"today":"")+'"><div class="day">'+(i===0?"Today":formatDay(day.date))+'</div><div class="emoji">'+condition(symbol)[1]+'</div><div class="temps"><span>'+ft(day.maxtempC)+'°</span><span class="low">'+ft(day.mintempC)+'°</span></div><div class="rain">💧 '+rain+'%</div></div>';
  }).join("");
}

async function requestWeather(u){
  try{
    const r=await fetch(u);
    if(!r.ok)throw Error("Direct request failed");
    return await r.json();
  }catch{
    const fallback=API.proxy+encodeURIComponent(u.toString());
    const r=await fetch(fallback);
    if(!r.ok)throw Error("Weather service is unavailable right now.");
    return await r.json();
  }
}

async function loadWeather(location){
  setStatus("Loading live weather…");
  const u=new URL(location.latitude+","+location.longitude,API.weather+"/");
  u.searchParams.set("format","j1");u.searchParams.set("lang","en");
  state.location=location;state.weather=await requestWeather(u);render();
  setStatus("Updated just now · "+(location.name||"Your location"));
}

async function searchCity(q){
  setStatus("Finding that location…");
  const u=new URL(API.geo);u.searchParams.set("name",q);u.searchParams.set("count","1");u.searchParams.set("language","en");
  const r=await fetch(u);if(!r.ok)throw Error("Location search failed.");
  const data=await r.json();if(!data.results?.length)throw Error("No matching city found.");await loadWeather(data.results[0]);
}

el.form.addEventListener("submit",async e=>{e.preventDefault();try{await searchCity(el.input.value.trim())}catch(err){setStatus(err.message,true)}});
el.loc.addEventListener("click",()=>{if(!navigator.geolocation)return setStatus("Geolocation is not supported.",true);setStatus("Getting your location…");navigator.geolocation.getCurrentPosition(async p=>{try{await loadWeather({name:"Your location",latitude:p.coords.latitude,longitude:p.coords.longitude,country_code:""})}catch(err){setStatus(err.message,true)}},()=>setStatus("Location access was blocked. Search for a city instead.",true),{enableHighAccuracy:true,timeout:10000})});
el.unit.addEventListener("click",()=>{state.unit=state.unit==="C"?"F":"C";render()});
loadWeather({name:"Pune",country_code:"IN",latitude:18.5204,longitude:73.8567}).catch(err=>setStatus(err.message,true));