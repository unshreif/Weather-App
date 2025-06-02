const apiKey = '7d5b865ca184439bad0162808240710';
const defaultCity = 'Cairo';

const weatherIcons = {
    'Sunny': 'wi-day-sunny',
    'Clear': 'wi-night-clear',
    'Partly cloudy': 'wi-day-cloudy',
    'Cloudy': 'wi-cloudy',
    'Overcast': 'wi-cloudy',
    'Mist': 'wi-fog',
    'Patchy rain possible': 'wi-day-rain',
    'Patchy snow possible': 'wi-day-snow',
    'Patchy sleet possible': 'wi-day-sleet',
    'Patchy freezing drizzle possible': 'wi-day-sleet',
    'Thundery outbreaks possible': 'wi-day-thunderstorm',
    'Blowing snow': 'wi-snow-wind',
    'Blizzard': 'wi-snow-wind',
    'Fog': 'wi-fog',
    'Freezing fog': 'wi-fog',
    'Patchy light drizzle': 'wi-day-sprinkle',
    'Light drizzle': 'wi-sprinkle',
    'Freezing drizzle': 'wi-sleet',
    'Heavy freezing drizzle': 'wi-sleet',
    'Patchy light rain': 'wi-day-rain',
    'Light rain': 'wi-rain',
    'Moderate rain at times': 'wi-rain',
    'Moderate rain': 'wi-rain',
    'Heavy rain at times': 'wi-rain',
    'Heavy rain': 'wi-rain',
    'Light freezing rain': 'wi-sleet',
    'Moderate or heavy freezing rain': 'wi-sleet',
    'Light sleet': 'wi-sleet',
    'Moderate or heavy sleet': 'wi-sleet',
    'Patchy light snow': 'wi-day-snow',
    'Light snow': 'wi-snow',
    'Patchy moderate snow': 'wi-snow',
    'Moderate snow': 'wi-snow',
    'Patchy heavy snow': 'wi-snow',
    'Heavy snow': 'wi-snow',
    'Ice pellets': 'wi-hail',
    'Light rain shower': 'wi-showers',
    'Moderate or heavy rain shower': 'wi-showers',
    'Torrential rain shower': 'wi-showers',
    'Light sleet showers': 'wi-sleet',
    'Moderate or heavy sleet showers': 'wi-sleet',
    'Light snow showers': 'wi-snow',
    'Moderate or heavy snow showers': 'wi-snow',
    'Light showers of ice pellets': 'wi-hail',
    'Moderate or heavy showers of ice pellets': 'wi-hail',
    'Patchy light rain with thunder': 'wi-thunderstorm',
    'Moderate or heavy rain with thunder': 'wi-thunderstorm',
    'Patchy light snow with thunder': 'wi-thunderstorm',
    'Moderate or heavy snow with thunder': 'wi-thunderstorm'
};

const cityInput = document.getElementById('cityInput');
const cityList = document.getElementById('cityList');
const searchBtn = document.getElementById('searchBtn');
const weekContainer = document.getElementById('week');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const closeError = document.getElementById('closeError');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

let currentUnit = 'celsius';

function getUserDefaultCity() {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeather(`${lat},${lon}`);
    }, error => {
        console.error('Error getting location:', error);
        fetchWeather(defaultCity);
    });
}

function getWeatherIcon(condition) {
    return weatherIcons[condition] || 'wi-day-cloudy';
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function hideError() {
    errorModal.style.display = 'none';
}

function convertTemp(temp, unit) {
    if (unit === 'fahrenheit') {
        return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
}

function updateTemperatureDisplay(element, temp, unit) {
    const convertedTemp = convertTemp(temp, unit);
    element.textContent = `${convertedTemp}°${unit === 'celsius' ? 'C' : 'F'}`;
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function createCityListElement(city) {
    const li = document.createElement('li');
    const cityFullName = `${city.name}, ${city.region}, ${city.country}`;
    li.textContent = cityFullName;
    li.classList.add('city-item');
    li.addEventListener('click', () => {
        cityInput.value = cityFullName;
        cityList.innerHTML = '';
        cityList.style.display = 'none';
        fetchWeather(city.name);
    });
    return li;
}

async function fetchCities(search = '') {
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${search}`);
        if (!response.ok) {
            throw new Error('Failed to fetch cities');
        }
        const cities = await response.json();
        if (cities.length === 0) {
            cityList.style.display = 'none';
            return;
        }
        cityList.style.display = 'block';
        cityList.innerHTML = '';
        cities.forEach(city => {
            const listElement = createCityListElement(city);
            cityList.appendChild(listElement);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        showError('Failed to load city list');
    }
}

async function fetchWeather(city) {
    showLoading();
    try {
        const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7&aqi=yes`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        updateCurrentWeather(data);
        updateForecast(data);
        updateLastUpdated();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function getAirQualityText(aqi) {
    const qualityMap = {
        1: 'Good',
        2: 'Moderate',
        3: 'Unhealthy for Sensitive Groups',
        4: 'Unhealthy',
        5: 'Very Unhealthy',
        6: 'Hazardous'
    };
    return qualityMap[aqi] || 'Unknown';
}

function updateCurrentWeather(data) {
    const cityFullName = `${data.location.name}, ${data.location.region}, ${data.location.country}`;
    cityInput.value = cityFullName;
    document.querySelector('.city-name').textContent = cityFullName;
    updateTemperatureDisplay(document.getElementById('temp'), data.current.temp_c, currentUnit);
    document.getElementById('weather').textContent = data.current.condition.text;
    
    const currentIcon = document.getElementById('currentIcon');
    currentIcon.className = `wi ${getWeatherIcon(data.current.condition.text)}`;

    updateTemperatureDisplay(document.getElementById('feelsLike'), data.current.feelslike_c, currentUnit);
    document.getElementById('windSpeed').textContent = `${data.current.wind_kph} km/h`;
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('visibility').textContent = `${data.current.vis_km} km`;
    document.getElementById('airQuality').textContent = getAirQualityText(data.current.air_quality['us-epa-index']);
}

function updateForecast(data) {
    weekContainer.innerHTML = '';

    data.forecast.forecastday.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="date">${dayName}</div>
            <i class="wi ${getWeatherIcon(day.day.condition.text)}"></i>
            <div class="temp"></div>
        `;
        
        updateTemperatureDisplay(
            forecastDay.querySelector('.temp'),
            day.day.avgtemp_c,
            currentUnit
        );
        
        weekContainer.appendChild(forecastDay);
    });
}

function updateLastUpdated() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = formatTime(now);
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    }
});

cityInput.addEventListener('input', () => {
    const search = cityInput.value.trim();
    if (search.length >= 2) {
        fetchCities(search);
    } else {
        cityList.style.display = 'none';
        cityList.innerHTML = '';
    }
});

cityInput.addEventListener('focus', () => {
    const search = cityInput.value.trim();
    if (search.length >= 2) {
        fetchCities(search);
        cityList.style.display = 'block';
    }
});

closeError.addEventListener('click', hideError);

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'celsius') {
        currentUnit = 'celsius';
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'fahrenheit') {
        currentUnit = 'fahrenheit';
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
     getUserDefaultCity();
}); 

document.addEventListener('click', (event) => {
    if (!cityInput.contains(event.target) && !cityList.contains(event.target)) {
        cityList.style.display = 'none';
    }
});