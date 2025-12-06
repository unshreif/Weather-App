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

// DOM Elements
const cityInput = document.getElementById('cityInput');
const cityList = document.getElementById('cityList');
const weekContainer = document.getElementById('week');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const closeError = document.getElementById('closeError');
const unitToggle = document.getElementById('unitToggle');
const unitText = document.querySelector('.unit-text');

// State
let currentUnit = 'celsius'; // 'celsius' or 'fahrenheit'
let currentWeatherData = null; // Store data to re-render on unit toggle

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    getUserDefaultCity();
});

// --- Event Listeners ---
unitToggle.addEventListener('click', toggleUnit);
closeError.addEventListener('click', hideError);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
            cityList.style.display = 'none';
        }
    }
});

let debounceTimer;
cityInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const search = cityInput.value.trim();

    if (search.length >= 2) {
        debounceTimer = setTimeout(() => {
            fetchCities(search);
        }, 300);
    } else {
        cityList.style.display = 'none';
        cityList.innerHTML = '';
    }
});

// Close city list when clicking outside
document.addEventListener('click', (event) => {
    if (!cityInput.contains(event.target) && !cityList.contains(event.target)) {
        cityList.style.display = 'none';
    }
});

// --- Core Functions ---

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

function toggleUnit() {
    currentUnit = currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    unitText.textContent = currentUnit === 'celsius' ? '°C' : '°F';

    // Update UI if we have data
    if (currentWeatherData) {
        updateUI(currentWeatherData);
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
        currentWeatherData = data; // Store for unit toggling
        updateUI(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function fetchCities(search = '') {
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${search}`);
        if (!response.ok) throw new Error('Failed to fetch cities');

        const cities = await response.json();
        if (cities.length === 0) {
            cityList.style.display = 'none';
            return;
        }

        cityList.style.display = 'block';
        cityList.innerHTML = '';
        cities.forEach(city => {
            const li = document.createElement('li');
            li.className = 'city-item';
            li.textContent = `${city.name}, ${city.country}`;
            li.addEventListener('click', () => {
                cityInput.value = city.name;
                cityList.style.display = 'none';
                fetchWeather(city.name);
            });
            cityList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
}

// --- UI Update Functions ---

function updateUI(data) {
    updateCurrentWeather(data);
    updateForecast(data);
    updateLastUpdated();
}

function updateCurrentWeather(data) {
    const { location, current } = data;

    document.querySelector('.city-name').textContent = location.name;
    document.getElementById('weather').textContent = current.condition.text;

    // Main Temp
    const tempVal = currentUnit === 'celsius' ? current.temp_c : current.temp_f;
    document.getElementById('temp').textContent = Math.round(tempVal);

    // Icon
    const iconClass = weatherIcons[current.condition.text] || 'wi-day-cloudy';
    document.getElementById('currentIcon').className = `wi ${iconClass}`;

    // Details
    const feelsLike = currentUnit === 'celsius' ? current.feelslike_c : current.feelslike_f;
    document.getElementById('feelsLike').textContent = `${Math.round(feelsLike)}°`;

    document.getElementById('windSpeed').textContent = `${current.wind_kph} km/h`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('visibility').textContent = `${current.vis_km} km`;

    if (current.air_quality) {
        const aqi = current.air_quality['us-epa-index'];
        document.getElementById('airQuality').textContent = getAirQualityText(aqi);
    } else {
        document.getElementById('airQuality').textContent = 'N/A';
    }
}

function updateForecast(data) {
    weekContainer.innerHTML = '';

    data.forecast.forecastday.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = currentUnit === 'celsius' ? day.day.avgtemp_c : day.day.avgtemp_f;

        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
        item.style.opacity = '0'; // Start hidden for animation

        item.innerHTML = `
            <span class="day">${dayName}</span>
            <i class="wi ${weatherIcons[day.day.condition.text] || 'wi-day-cloudy'}"></i>
            <span class="temp">${Math.round(temp)}°</span>
        `;

        weekContainer.appendChild(item);
    });
}

// --- Helper Functions ---

function showLoading() { loadingOverlay.style.display = 'flex'; }
function hideLoading() { loadingOverlay.style.display = 'none'; }
function showError(msg) {
    errorMessage.textContent = msg;
    errorModal.style.display = 'flex';
}
function hideError() { errorModal.style.display = 'none'; }

function updateLastUpdated() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAirQualityText(aqi) {
    const map = {
        1: 'Good', 2: 'Moderate', 3: 'Sensitive',
        4: 'Unhealthy', 5: 'Very Unhealthy', 6: 'Hazardous'
    };
    return map[aqi] || 'Unknown';
}