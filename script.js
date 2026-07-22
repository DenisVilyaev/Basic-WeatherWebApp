const hourlyListToggleBtn = document.querySelector(".hourly-list-toggle");
const tabBtn = document.querySelectorAll(".tab");
const input = document.querySelector(".input");
const mainDate = document.querySelector(".conditions-date");
const mainTemp = document.querySelector(".conditions-temp");
const mainDesc = document.querySelector(".conditions-desc");
const mainIcon = document.querySelector(".weather-block__icon")
const mainMinMax = document.querySelector(".conditions-minmax");
const metricWind = document.querySelector(".weather-block__metric-wind");
const metricProb = document.querySelector(".weather-block__metric-prob");
const metricSunrise = document.querySelector(".weather-block__metric-sunrise");
const metricSunset = document.querySelector(".weather-block__metric-sunset");
const hourlyList = document.querySelector(".hourly-list");
const notification = document.querySelector(".notification")

let activeIndex = 1

let data = JSON.parse(localStorage.getItem("data")) || ""
if (JSON.parse(localStorage.getItem("hourlyListToggleBtn")) !== false) hourlyList.classList.add("hourly-list_compact") 


function renderDayCard(CurrentDay) {
  const date = new Date(CurrentDay.datetime)
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = date.toLocaleDateString("ru-RU", dateOptions).replace(",", " |")
  mainDate.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  mainTemp.textContent = Math.round(CurrentDay.temp) + "°"

  mainDesc.textContent = CurrentDay.conditions

  mainMinMax.textContent = `Макс: ${Math.round(CurrentDay.tempmax)}° | Мин: ${Math.round(CurrentDay.tempmin)}°`

  mainIcon.src = `./svg/${CurrentDay.icon}.svg`

  metricWind.textContent = `${(CurrentDay.windspeed / 3.6).toFixed()} м/с`

  metricProb.textContent = `${CurrentDay.precipprob}%`

  metricSunrise.textContent = CurrentDay.sunrise.slice(0, 5)

  metricSunset.textContent = CurrentDay.sunset.slice(0, 5)
}

function renderHourlyCard(hourData) {
  const card = document.createElement("div");
  card.classList.add("hourly-list__card");

  const cardTime = document.createElement("div");
  cardTime.classList.add("hourly-list__card-time");
  cardTime.textContent = hourData.datetime.slice(0, 5)

  const cardIcon = document.createElement("img");
  cardIcon.classList.add("hourly-list__icon");
  cardIcon.src = `./svg/${hourData.icon}.svg`

  const cardTemp = document.createElement("div");
  cardTemp.classList.add("hourly-list__card-temp");
  cardTemp.textContent = formatTemperatureOfHourlyCard(hourData.temp);
  

  const cardFeelslike = document.createElement("div");
  cardFeelslike.classList.add("hourly-list__card-feelslike");
  cardFeelslike.textContent = formatTemperatureOfHourlyCard(hourData.feelslike);

  card.append(cardTime, cardIcon, cardTemp, cardFeelslike);

  hourlyList.append(card);
}

function formatTemperatureOfHourlyCard(temp) {
  const rounded = Math.round(temp)
  return rounded < 0 ? `${rounded}°` : `+${rounded}°`
}

function renderHourlyCards(hoursData) {
  for (let i = 0; i < hoursData.length; i++) {
    renderHourlyCard(hoursData[i]);
  }
}


function getDateStr(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}
const yesterday = getDateStr(-1);
const today = getDateStr(0);
const tomorrow = getDateStr(1);


function updateWeather() {
  hourlyList.innerHTML = ""
  const dataCurrentDay = data.days[activeIndex]
    renderHourlyCards(dataCurrentDay.hours);
    renderDayCard(dataCurrentDay)
}

async function getData(city) {
  try {
    const response = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}/${yesterday}/${tomorrow}?unitGroup=metric&key=4MWVDT6FX3NQEFHDB4VLAR58L&contentType=json&lang=ru`
    );
    if (!response.ok) {
      if (response.status === 400) {
        input.placeholder = "⌕ Город не найден"
        input.classList.add("input_error") 
        setTimeout(() => {
         input.classList.remove("input_error") 
        }, 2000)
      }
      else if (response.status === 429) {
        notification.classList.add('notification_visible')
        notification.textContent = "Превышен лимит запросов"
        setTimeout (() => {
          notification.classList.remove('notification_visible')
        }, 2000)
      }
      else {
        notification.classList.add('notification_visible')
        notification.textContent = "Что-то пошло не так"
        setTimeout (() => {
          notification.classList.remove('notification_visible')
        }, 2000)
        throw new Error("Ошибка сервера");
      }
    }
    data = await response.json();
    console.log(data);
    updateWeather()
    localStorage.setItem("city", city)
    localStorage.setItem("data", JSON.stringify(data))
    localStorage.setItem("fetchTime", Date.now())
    
  } catch (error) {
    console.error("Произошла ошибка:", error.message);

  }
}
const savedCity = localStorage.getItem("city")
const isFresh = Date.now() - Number(localStorage.getItem("fetchTime")) < 3600000
if(data !== "" && isFresh) {
  updateWeather()
  input.placeholder = `⌕ ${data.address}`
} else if (savedCity) {
  getData(savedCity)
} else {
  navigator.geolocation.getCurrentPosition(
    (position) => {getData(`${position.coords.latitude},${position.coords.longitude}`),
    input.placeholder = `⌕ Текущее местоположение`},
    (error) => getData("Москва")
  )
}
console.log(data)

tabBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtn.forEach((btn) => {
      btn.classList.remove("tab--active");
    });
    btn.classList.add("tab--active");
    activeIndex = btn.dataset.index
    updateWeather()
  });
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    input.placeholder = `⌕ ${input.value}`
    getData(input.value);
    input.value = ""
  } else return;
});

hourlyListToggleBtn.addEventListener("click", () => {
  hourlyList.classList.toggle("hourly-list_compact")
  localStorage.setItem("hourlyListToggleBtn", JSON.stringify(hourlyList.classList.contains("hourly-list_compact")))
})