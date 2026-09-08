/**
 * Weather Module
 * Coordinates Open-Meteo API communication and DOM updates.
 * Features Self-Healing: Automatically falls back to direct Open-Meteo API if backend server is not running!
 */

const WMO_CODES = {
  0: { en: 'Clear sky', hi: 'साफ़ आसमान', icon: '☀️' },
  1: { en: 'Mainly clear', hi: 'मुख्यतः साफ़', icon: '🌤️' },
  2: { en: 'Partly cloudy', hi: 'आंशिक रूप से बादल', icon: '⛅' },
  3: { en: 'Overcast', hi: 'घने बादल', icon: '☁️' },
  45: { en: 'Foggy', hi: 'कोहरा', icon: '🌫️' },
  48: { en: 'Depositing rime fog', hi: 'घना जमाव वाला कोहरा', icon: '🌫️' },
  51: { en: 'Light drizzle', hi: 'हल्की बूंदाबांदी', icon: '🌦️' },
  53: { en: 'Moderate drizzle', hi: 'मध्यम बूंदाबांदी', icon: '🌦️' },
  55: { en: 'Dense drizzle', hi: 'घनी बूंदाबांदी', icon: '🌧️' },
  61: { en: 'Slight rain', hi: 'हल्की बारिश', icon: '🌧️' },
  63: { en: 'Moderate rain', hi: 'मध्यम बारिश', icon: '🌧️' },
  65: { en: 'Heavy rain', hi: 'भारी बारिश', icon: '⛈️' },
  71: { en: 'Slight snowfall', hi: 'हल्की बर्फबारी', icon: '🌨️' },
  73: { en: 'Moderate snowfall', hi: 'मध्यम बर्फबारी', icon: '🌨️' },
  75: { en: 'Heavy snowfall', hi: 'भारी बर्फबारी', icon: '❄️' },
  80: { en: 'Slight rain showers', hi: 'हल्की बौछारें', icon: '🌦️' },
  81: { en: 'Moderate rain showers', hi: 'मध्यम बौछारें', icon: '🌧️' },
  82: { en: 'Violent rain showers', hi: 'तेज मूसलाधार बौछारें', icon: '⛈️' },
  95: { en: 'Thunderstorm', hi: 'गरज के साथ तूफ़ान', icon: '⛈️' },
  96: { en: 'Thunderstorm with hail', hi: 'आंधी-तूफान व ओले', icon: '⛈️' },
  99: { en: 'Severe Thunderstorm', hi: 'भीषण आंधी-तूफान', icon: '⛈️' }
};

function parseWmo(code, lang = 'en') {
  const match = WMO_CODES[code] || { en: 'Moderate Weather', hi: 'सामान्य मौसम', icon: '🌤️' };
  return {
    description: lang === 'hi' ? match.hi : match.en,
    icon: match.icon,
    code
  };
}

let currentWeatherPayload = null;
let currentCityInfo = { name: 'Meerut', admin1: 'Uttar Pradesh', country: 'India' };

const WeatherService = {
  getCurrentData() {
    return currentWeatherPayload;
  },

  getCurrentCity() {
    return currentCityInfo;
  },

  /**
   * Search city: First tries backend `/api/weather/geocode`, then falls back to Open-Meteo direct
   */
  async searchCity(query) {
    if (!query || !query.trim()) return [];

    // Try backend proxy first if on http/https
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch(`/api/weather/geocode?city=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results) return data.results;
        }
      } catch (err) {
        console.warn('Backend geocode unavailable, using direct Open-Meteo fallback');
      }
    }

    // Direct Open-Meteo Geocoding API
    const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`;
    const res = await fetch(directUrl);
    if (!res.ok) throw new Error('Location search failed');
    const data = await res.json();
    return (data.results || []).map((loc) => ({
      id: loc.id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      country: loc.country || '',
      admin1: loc.admin1 || '',
      timezone: loc.timezone || 'auto'
    }));
  },

  /**
   * Load weather: First tries backend `/api/weather/forecast`, then falls back to Open-Meteo direct
   */
  async loadCityWeather(cityObj, lang = 'en') {
    currentCityInfo = {
      name: cityObj.name,
      admin1: cityObj.admin1 || '',
      country: cityObj.country || '',
      latitude: cityObj.latitude,
      longitude: cityObj.longitude,
      timezone: cityObj.timezone || 'auto'
    };

    let weatherData = null;

    // Try backend proxy if on http
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch(`/api/weather/forecast?lat=${cityObj.latitude}&lon=${cityObj.longitude}&tz=${encodeURIComponent(cityObj.timezone || 'auto')}`);
        if (res.ok) {
          weatherData = await res.json();
        }
      } catch (err) {
        console.warn('Backend weather proxy unavailable, using direct Open-Meteo API');
      }
    }

    // Direct Open-Meteo fetch fallback
    if (!weatherData) {
      weatherData = await this.fetchDirectOpenMeteo(cityObj.latitude, cityObj.longitude, cityObj.timezone, lang);
    }

    currentWeatherPayload = weatherData;

    // Update DOM components
    this.renderDashboard(currentCityInfo, currentWeatherPayload, lang);
    if (window.WeatherCharts) {
      window.WeatherCharts.updateData(currentWeatherPayload.hourly);
    }

    return { city: currentCityInfo, weather: currentWeatherPayload };
  },

  /**
   * Direct fetch from Open-Meteo API (works even when double clicking index.html!)
   */
  async fetchDirectOpenMeteo(lat, lon, tz = 'auto', lang = 'en') {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      timezone: tz || 'auto'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather forecast fetch failed');
    const raw = await res.json();

    const current = {
      time: raw.current.time,
      temperature: Math.round(raw.current.temperature_2m),
      feelsLike: Math.round(raw.current.apparent_temperature),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: Math.round(raw.current.wind_speed_10m),
      windDirection: raw.current.wind_direction_10m,
      precipitation: raw.current.precipitation,
      weatherCode: raw.current.weather_code,
      wmo: parseWmo(raw.current.weather_code, lang)
    };

    const hourly = raw.hourly.time.slice(0, 24).map((timeStr, idx) => ({
      time: timeStr,
      hourLabel: new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: Math.round(raw.hourly.temperature_2m[idx]),
      humidity: raw.hourly.relative_humidity_2m[idx],
      rainProbability: raw.hourly.precipitation_probability[idx] ?? 0,
      windSpeed: Math.round(raw.hourly.wind_speed_10m[idx]),
      weatherCode: raw.hourly.weather_code[idx],
      wmo: parseWmo(raw.hourly.weather_code[idx], lang)
    }));

    const daily = raw.daily.time.map((dateStr, idx) => {
      const d = new Date(dateStr);
      return {
        date: dateStr,
        dayName: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNameHi: idx === 0 ? 'आज' : idx === 1 ? 'कल' : d.toLocaleDateString('hi-IN', { weekday: 'short' }),
        maxTemp: Math.round(raw.daily.temperature_2m_max[idx]),
        minTemp: Math.round(raw.daily.temperature_2m_min[idx]),
        rainProbability: raw.daily.precipitation_probability_max[idx] ?? 0,
        windSpeedMax: Math.round(raw.daily.wind_speed_10m_max[idx]),
        weatherCode: raw.daily.weather_code[idx],
        wmo: parseWmo(raw.daily.weather_code[idx], lang)
      };
    });

    return { latitude: raw.latitude, longitude: raw.longitude, current, hourly, daily };
  },

  async loadCoordinatesWeather(lat, lon, lang = 'en') {
    let resolvedCity = { name: 'My Location', admin1: '', country: '', latitude: lat, longitude: lon };
    try {
      const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (revRes.ok) {
        const revData = await revRes.json();
        resolvedCity.name = revData.city || revData.locality || 'My Location';
        resolvedCity.admin1 = revData.principalSubdivision || '';
        resolvedCity.country = revData.countryName || '';
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
    return await this.loadCityWeather(resolvedCity, lang);
  },

  renderDashboard(city, data, lang = 'en') {
    const isHi = lang === 'hi';
    const current = data.current;
    const today = data.daily?.[0] || {};

    const cityEl = document.getElementById('cityName');
    if (cityEl) cityEl.textContent = city.name;

    const subtextEl = document.getElementById('locationSubtext');
    if (subtextEl) {
      const parts = [city.admin1, city.country].filter(Boolean);
      subtextEl.textContent = parts.join(', ') || 'Global';
    }

    const timeEl = document.getElementById('localTime');
    if (timeEl) {
      timeEl.textContent = `${isHi ? 'अपडेट किया गया' : 'Updated'}: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const iconEl = document.getElementById('weatherIcon');
    if (iconEl) iconEl.textContent = current.wmo.icon || '☀️';

    const condEl = document.getElementById('weatherCondition');
    if (condEl) condEl.textContent = current.wmo.description;

    const tempEl = document.getElementById('currentTemp');
    if (tempEl) tempEl.textContent = current.temperature;

    const feelsEl = document.getElementById('feelsLikeTemp');
    if (feelsEl) feelsEl.textContent = current.feelsLike;

    const humEl = document.getElementById('humidityVal');
    if (humEl) humEl.textContent = `${current.humidity}%`;

    const windEl = document.getElementById('windVal');
    if (windEl) windEl.textContent = `${current.windSpeed} km/h`;

    const rainEl = document.getElementById('rainProbVal');
    if (rainEl) rainEl.textContent = `${today.rainProbability ?? 0}%`;

    const rangeEl = document.getElementById('dailyRangeVal');
    if (rangeEl) rangeEl.textContent = `${today.minTemp ?? '--'}° / ${today.maxTemp ?? '--'}°C`;

    this.renderForecastGrid(data.daily, isHi);
    this.renderAlertBanner(current, today, isHi);
  },

  renderForecastGrid(dailyList, isHi) {
    const container = document.getElementById('forecastContainer');
    if (!container || !dailyList) return;

    container.innerHTML = dailyList.map((day) => {
      const dayTitle = isHi ? day.dayNameHi : day.dayName;
      return `
        <div class="forecast-item">
          <div class="forecast-day">${dayTitle}</div>
          <div class="forecast-icon">${day.wmo.icon}</div>
          <div class="forecast-temps">
            <span class="forecast-max">${day.maxTemp}°</span>
            <span class="forecast-min">${day.minTemp}°</span>
          </div>
          <div class="forecast-rain">
            <i class="fa-solid fa-droplet"></i> ${day.rainProbability}%
          </div>
        </div>
      `;
    }).join('');
  },

  renderAlertBanner(current, today, isHi) {
    const banner = document.getElementById('weatherAlertBanner');
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMessage');
    if (!banner || !titleEl || !msgEl) return;

    const rainProb = today.rainProbability ?? 0;
    const maxTemp = today.maxTemp ?? 0;
    const windSpeed = current.windSpeed ?? 0;

    if (rainProb >= 60) {
      banner.className = 'alert-banner alert-warning';
      titleEl.textContent = isHi ? '🌧️ भारी वर्षा चेतावनी' : '🌧️ Rain Advisory';
      msgEl.textContent = isHi 
        ? `आज वर्षा की अधिकतम संभावना ${rainProb}% है। यात्रा करते समय छाता साथ रखें।`
        : `Rain probability is ${rainProb}% today. Plan outdoor activities with caution.`;
      banner.classList.remove('hidden');
    } else if (maxTemp >= 40) {
      banner.className = 'alert-banner';
      titleEl.textContent = isHi ? '☀️ अत्यधिक गर्मी चेतावनी' : '☀️ High Heat Advisory';
      msgEl.textContent = isHi
        ? `आज तापमान ${maxTemp}°C तक पहुंचने का अनुमान है। धूप से बचें व पर्याप्त पानी पिएं।`
        : `Temperatures expected to peak at ${maxTemp}°C. Stay well-hydrated.`;
      banner.classList.remove('hidden');
    } else if (windSpeed >= 35) {
      banner.className = 'alert-banner alert-warning';
      titleEl.textContent = isHi ? '💨 तेज हवा की चेतावनी' : '💨 High Wind Warning';
      msgEl.textContent = isHi
        ? `हवा की गति ${windSpeed} किमी/घंटा है। खुले में सावधानी बरतें।`
        : `Gusts up to ${windSpeed} km/h detected. Exercise caution outdoors.`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }
};

if (typeof window !== 'undefined') {
  window.WeatherService = WeatherService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherService;
}
