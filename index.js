const weatherApiKey = '7d5b865ca184439bad0162808240710';
const defaultCity = 'Cairo';

// WMO Weather Codes to Icons mapping
const wmoIcons = {
    0: 'wi-day-sunny', // Clear sky
    1: 'wi-day-sunny-overcast', // Mainly clear
    2: 'wi-day-cloudy', // Partly cloudy
    3: 'wi-cloudy', // Overcast
    45: 'wi-fog', // Fog
    48: 'wi-fog', // Depositing rime fog
    51: 'wi-sprinkle', // Drizzle: Light
    53: 'wi-sprinkle', // Drizzle: Moderate
    55: 'wi-showers', // Drizzle: Dense
    56: 'wi-sleet', // Freezing Drizzle: Light
    57: 'wi-sleet', // Freezing Drizzle: Dense
    61: 'wi-rain', // Rain: Slight
    63: 'wi-rain', // Rain: Moderate
    65: 'wi-rain-wind', // Rain: Heavy
    66: 'wi-sleet', // Freezing Rain: Light
    67: 'wi-sleet', // Freezing Rain: Heavy
    71: 'wi-snow', // Snow fall: Slight
    73: 'wi-snow', // Snow fall: Moderate
    75: 'wi-snow-wind', // Snow fall: Heavy
    77: 'wi-hail', // Snow grains
    80: 'wi-showers', // Rain showers: Slight
    81: 'wi-showers', // Rain showers: Moderate
    82: 'wi-storm-showers', // Rain showers: Violent
    85: 'wi-snow', // Snow showers: Slight
    86: 'wi-snow', // Snow showers: Heavy
    95: 'wi-thunderstorm', // Thunderstorm: Slight or moderate
    96: 'wi-storm-showers', // Thunderstorm with slight hail
    99: 'wi-storm-showers' // Thunderstorm with heavy hail
};

const wmoDescriptions = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
    55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain',
    67: 'Heavy freezing rain', 71: 'Slight snow fall', 73: 'Moderate snow fall',
    75: 'Heavy snow fall', 77: 'Snow grains', 80: 'Slight rain showers',
    81: 'Moderate rain showers', 82: 'Violent rain showers', 85: 'Slight snow showers',
    86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
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
            resolveCityAndFetch(city);
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
        // We need a city name for the display, so let's reverse geocode or just fetch weather
        // Open-Meteo doesn't give city name. We can use WeatherAPI to get city name from lat/lon
        fetchCityNameAndWeather(lat, lon);
    }, error => {
        console.error('Error getting location:', error);
        resolveCityAndFetch(defaultCity);
    });
}

function toggleUnit() {
    currentUnit = currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    unitText.textContent = currentUnit === 'celsius' ? '°C' : '°F';
    if (currentWeatherData) {
        updateUI(currentWeatherData);
    }
}

async function fetchCities(search = '') {
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${weatherApiKey}&q=${search}`);
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
                // Pass name for display, but use lat/lon if available? 
                // WeatherAPI search gives lat/lon.
                fetchWeather(city.lat, city.lon, city.name);
            });
            cityList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
}

async function resolveCityAndFetch(cityName) {
    showLoading();
    try {
        // Get coords from WeatherAPI
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${weatherApiKey}&q=${cityName}`);
        if (!response.ok) throw new Error('City not found');
        const cities = await response.json();
        if (cities.length === 0) throw new Error('City not found');

        const city = cities[0];
        fetchWeather(city.lat, city.lon, city.name);
    } catch (error) {
        console.error(error);
        showError(error.message);
        hideLoading();
    }
}

async function fetchCityNameAndWeather(lat, lon) {
    // Reverse geocode to get name (optional, or just show "My Location")
    // We can use WeatherAPI search with lat,lon
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${weatherApiKey}&q=${lat},${lon}`);
        const cities = await response.json();
        const name = cities.length > 0 ? cities[0].name : 'My Location';
        fetchWeather(lat, lon, name);
    } catch (e) {
        fetchWeather(lat, lon, 'My Location');
    }
}

async function fetchWeather(lat, lon, cityName) {
    showLoading();
    try {
        // Fetch from Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch weather data');

        const data = await response.json();

        // Structure data for UI
        currentWeatherData = {
            cityName: cityName,
            current: data.current,
            daily: data.daily,
            units: data.current_units
        };

        updateUI(currentWeatherData);
    } catch (error) {
        console.error('Error:', error);
        showError('Could not retrieve weather data.');
    } finally {
        hideLoading();
    }
}

// --- UI Update Functions ---

function updateUI(data) {
    updateCurrentWeather(data);
    updateForecast(data);
    updateLastUpdated();
}

function updateCurrentWeather(data) {
    const { cityName, current } = data;

    document.querySelector('.city-name').textContent = cityName;

    const code = current.weather_code;
    document.getElementById('weather').textContent = wmoDescriptions[code] || 'Unknown';

    // Temp
    let temp = current.temperature_2m;
    let feelsLike = current.apparent_temperature;

    if (currentUnit === 'fahrenheit') {
        temp = (temp * 9 / 5) + 32;
        feelsLike = (feelsLike * 9 / 5) + 32;
    }

    document.getElementById('temp').textContent = Math.round(temp);
    document.getElementById('currentIcon').className = `wi ${wmoIcons[code] || 'wi-day-cloudy'}`;
    document.getElementById('feelsLike').textContent = `${Math.round(feelsLike)}°`;

    document.getElementById('windSpeed').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;

    // Open-Meteo doesn't give visibility/AQI in basic free call easily without extra params
    document.getElementById('visibility').textContent = '--';
    document.getElementById('airQuality').textContent = '--';
}

function updateForecast(data) {
    weekContainer.innerHTML = '';
    const { daily } = data;

    if (!daily || !daily.time) return;

    for (let i = 0; i < daily.time.length; i++) {
        const dateStr = daily.time[i];
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const code = daily.weather_code[i];

        let maxTemp = daily.temperature_2m_max[i];
        if (currentUnit === 'fahrenheit') maxTemp = (maxTemp * 9 / 5) + 32;

        const item = document.createElement('div');
        item.className = 'forecast-item';
        // Removed opacity: 0 to ensure visibility if animation fails
        item.style.animation = `fadeIn 0.5s ease forwards ${i * 0.1}s`;

        item.innerHTML = `
            <span class="day">${dayName}</span>
            <i class="wi ${wmoIcons[code] || 'wi-day-cloudy'}"></i>
            <span class="temp">${Math.round(maxTemp)}°</span>
        `;

        weekContainer.appendChild(item);
    }
}

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
    return 'N/A';
}