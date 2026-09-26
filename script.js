const state={unit:"C",location:null,weather:null};
const $=id=>document.getElementById(id);
const el={form:$("#searchForm"),input:$("#cityInput"),loc:$("#locationBtn"),unit:$("#unitToggle"),status:$("#status"),dash:$("#dashboard"),date:$("#dateLabel"),place:$("#locationLabel"),icon:$("#conditionIcon"),temp:$("#temperature"),tempUnit:$("#temperatureUnit"),cond:$("#conditionLabel"),feels:$("#feelsLike"),hi:$("#highTemp"),lo:$("#lowTemp"),rain:$("#rainChance"),humidity:$("#humidity"),wind:$("#wind"),clouds:$("#clouds"),precip:$("#precip"),hourly:$("#hourlyForecast"),sunrise:$("#sunrise"),sunset:$("#sunset"),uv:$("#uv"),forecast:$("#forecast"),tz:$("#timezoneLabel"),hourlyTz:$("#hourlyTimezone")};

const API={geo:"https://geocoding-api.open-meteo.com/v1/search",weather:"https://api.met.no/weatherapi/locationforecast/2.0/complete"};
const SYMBOLS={
  clearsky_day:["Clear sky","☀️"],clearsky_night:["Clear sky","🌙"],fair_day:["Fair","🌤️"],fair_night:["Fair","🌙"],
  partlycloudy_day:["Partly cloudy","⛅"],partlycloudy_night:["Partly cloudy","☁️"],cloudy:["Cloudy","☁️"],fog:["Fog","🌫️"],
  lightrain:["Light rain","🌦️"],rain:["Rain","🌧️"],heavyrain:["Heavy rain","🌧️"],lightsleet:["Light sleet","🌨️"],sleet:["Sleet","🌨️"],
  heavysleet:["Heavy sleet","🌨️"],lightsnow:["Light snow","🌨️"],snow:["Snow","❄️"],heavysnow:["Heavy snow","❄️"],
  rainshowers_day:["Rain showers","🌦️"],rainshowers_night:["Rain showers","🌧️"],heavyrainshowers_day:["Heavy rain showers","⛈️"],
  heavyrainshowers_night:["Heavy rain showers","⛈️"],lightssnowshowers_day:["Light snow showers","🌨️"],lightssnowshowers_night:["Light snow showers","🌨️"],
  heavysnowshowers_day:["Heavy snow showers","❄️"],heavysnowshowers_night:["Heavy snow showers","❄️"],
  rainshowersandthunder_day:["Thunderstorm","⛈️"],rainshowersandthunder_night:["Thunderstorm","⛈️"],
  heavyrainshowersandthunder_day:["Heavy thunderstorm","⛈️"],heavyrainshowersandthunder_night:["Heavy thunderstorm","⛈️"],
  lightrainshowersandthunder_day:["Thunderstorm","⛈️"],lightrainshowersandthunder_night:["Thunderstorm","⛈️"]
};
const condition=code=>SYMBOLS[code]||["Weather","🌡️"];
const setStatus=(text="",error=false)=>{el.status.textContent=text;el.status.classList.toggle("error",error)};
const ft=c=>Math.round(state.unit==="F"?c*9/5+32:c);
const suffix=()=>"°"+state.unit;
const timeLabel=iso=>new Date(iso).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
const key=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const dayName=(d,i)=>i===0?"Today":d.toLocaleDateString(undefined,{weekday:"short"});

function solarTimes(lat,lon,date=new Date()){
  const rad=Math.PI/180;
  const n=Math.floor((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(date.getFullYear(),0,0))/86400000);
  const lngHour=lon/15,zenith=90.8333;
  const calc=rise=>{
    const t=n+((rise?6:18)-lngHour)/24,M=.9856*t-3.289;
    let L=(M+1.916*Math.sin(M*rad)+.020*Math.sin(2*M*rad)+282.634)%360;if(L<0)L+=360;
    let RA=Math.atan(.91764*Math.tan(L*rad))/rad;if(RA<0)RA+=360;
    const Lq=Math.floor(L/90)*90,RAq=Math.floor(RA/90)*90;RA=(RA+Lq-RAq)/15;
    const sinDec=.39782*Math.sin(L*rad),cosDec=Math.cos(Math.asin(sinDec));
    const cosH=(Math.cos(zenith*rad)-sinDec*Math.sin(lat*rad))/(cosDec*Math.cos(lat*rad));
    if(cosH>1||cosH< -1)return null;
    let H=Math.acos(cosH)/rad;if(rise)H=360-H;H/=15;
    let UT=(H+RA-.06571*t-6.622-lngHour)%24;if(UT<0)UT+=24;
    return new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())+UT*3600000);
  };
  return {rise:calc(true),set:calc(false)};
}

function render(){
  const ts=state.weather.properties.timeseries,now=ts[0],d=now.data.instant.details;
  const period=now.data.next_1_hours?.details||now.data.next_6_hours?.details||{};
  const symbol=now.data.next_1_hours?.summary?.symbol_code||now.data.next_6_hours?.summary?.symbol_code||"cloudy";
  const pair=condition(symbol),today=new Date(),days=[];
  for(let i=0;i<7;i++){const x=new Date(today);x.setHours(12,0,0,0);x.setDate(today.getDate()+i);days.push(x)}
  const daily=days.map(day=>{
    const items=ts.filter(x=>key(new Date(x.time))===key(day));
    const vals=items.map(x=>x.data.instant.details.air_temperature).filter(Number.isFinite);
    const probs=items.flatMap(x=>[x.data.next_1_hours?.details?.probability_of_precipitation,x.data.next_6_hours?.details?.probability_of_precipitation,x.data.next_12_hours?.details?.probability_of_precipitation]).filter(Number.isFinite);
    const mid=items[Math.floor(items.length/2)]||items[0];
    return {day,max:vals.length?Math.max(...vals):d.air_temperature,min:vals.length?Math.min(...vals):d.air_temperature,rain:probs.length?Math.max(...probs):0,symbol:items[0]?.data.next_6_hours?.summary?.symbol_code||items[0]?.data.next_1_hours?.summary?.symbol_code||"cloudy",uv:mid?.data.instant.details.ultraviolet_index_clear_sky};
  });
  const solar=solarTimes(state.location.latitude,state.location.longitude,today);
  el.dash.classList.remove("hidden");el.date.textContent=today.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  el.place.textContent=(state.location.name||"Your location")+(state.location.country_code?", "+state.location.country_code:"");
  el.icon.textContent=pair[1];el.temp.textContent=ft(d.air_temperature);el.tempUnit.textContent=suffix();el.cond.textContent=pair[0];
  el.feels.textContent=ft(d.dew_point_temperature??d.air_temperature)+suffix();el.hi.textContent=ft(daily[0].max)+suffix();el.lo.textContent=ft(daily[0].min)+suffix();
  el.rain.textContent=Math.round(period.probability_of_precipitation??daily[0].rain)+"%";el.humidity.textContent=Math.round(d.relative_humidity)+"%";
  el.wind.textContent=Math.round(d.wind_speed*3.6)+" km/h";el.clouds.textContent=Math.round(d.cloud_area_fraction)+"%";el.precip.textContent=Number(period.precipitation_amount||0).toFixed(1)+" mm";
  el.tz.textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;el.hourlyTz.textContent=el.tz.textContent;el.unit.textContent=suffix();
  el.sunrise.textContent=solar.rise?timeLabel(solar.rise):"—";el.sunset.textContent=solar.set?timeLabel(solar.set):"—";el.uv.textContent=Number(daily[0].uv??0).toFixed(1);
  const future=ts.filter(x=>new Date(x.time).getTime()>=Date.now()).slice(0,12);
  el.hourly.innerHTML=future.map((x,i)=>{const q=x.data.instant.details,p=x.data.next_1_hours||x.data.next_6_hours||{},ico=condition(p.summary?.symbol_code||"cloudy")[1];return '<div class="hour '+(i===0?"now":"")+'"><span>'+timeLabel(x.time)+'</span><strong>'+ico+'</strong><b>'+ft(q.air_temperature)+'°</b><small>💧 '+Math.round(p.details?.probability_of_precipitation??0)+'%</small></div>'}).join("");
  el.forecast.innerHTML=daily.map((x,i)=>{const ico=condition(x.symbol)[1];return '<div class="forecast-day '+(i===0?"today":"")+'"><div class="day">'+dayName(x.day,i)+'</div><div class="emoji">'+ico+'</div><div class="temps"><span>'+ft(x.max)+'°</span><span class="low">'+ft(x.min)+'°</span></div><div class="rain">💧 '+Math.round(x.rain)+'%</div></div>'}).join("");
}

async function loadWeather(location){
  setStatus("Loading live weather…");
  const u=new URL(API.weather);u.searchParams.set("lat",Number(location.latitude).toFixed(4));u.searchParams.set("lon",Number(location.longitude).toFixed(4));
  const r=await fetch(u,{headers:{Accept:"application/json"}});
  if(!r.ok)throw Error(r.status===403?"MET Norway rejected this browser request. Try the deployed GitHub Pages version.":"Weather service is unavailable right now.");
  state.location=location;state.weather=await r.json();render();setStatus("Updated just now · "+(location.name||"Your location"));
}

async function searchCity(q){
  setStatus("Finding that location…");const u=new URL(API.geo);u.searchParams.set("name",q);u.searchParams.set("count","1");u.searchParams.set("language","en");
  const r=await fetch(u);if(!r.ok)throw Error("Location search failed.");const data=await r.json();if(!data.results?.length)throw Error("No matching city found.");await loadWeather(data.results[0]);
}
el.form.addEventListener("submit",async e=>{e.preventDefault();try{await searchCity(el.input.value.trim())}catch(err){setStatus(err.message,true)}});
el.loc.addEventListener("click",()=>{if(!navigator.geolocation)return setStatus("Geolocation is not supported.",true);setStatus("Getting your location…");navigator.geolocation.getCurrentPosition(async p=>{try{await loadWeather({name:"Your location",latitude:p.coords.latitude,longitude:p.coords.longitude,country_code:""})}catch(err){setStatus(err.message,true)}},()=>setStatus("Location access was blocked. Search for a city instead.",true),{enableHighAccuracy:true,timeout:10000})});
el.unit.addEventListener("click",()=>{state.unit=state.unit==="C"?"F":"C";render()});
loadWeather({name:"Pune",country_code:"IN",latitude:18.5204,longitude:73.8567}).catch(err=>setStatus(err.message,true));