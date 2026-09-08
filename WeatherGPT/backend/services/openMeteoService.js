/**
 * Open-Meteo Service
 * Responsible for fetching reliable weather and geocoding information.
 * Uses official, free, open-access Open-Meteo endpoints (no API key required).
 */

// Official WMO Weather Code definitions with both English & Hindi labels
const WMO_CODES = {
  0: { en: 'Clear sky', hi: 'साफ़ आसमान', icon: '☀️', condition: 'clear' },
  1: { en: 'Mainly clear', hi: 'मुख्यतः साफ़', icon: '🌤️', condition: 'mostly_clear' },
  2: { en: 'Partly cloudy', hi: 'आंशिक रूप से बादल', icon: '⛅', condition: 'partly_cloudy' },
  3: { en: 'Overcast', hi: 'घने बादल', icon: '☁️', condition: 'overcast' },
  45: { en: 'Foggy', hi: 'कोहरा', icon: '🌫️', condition: 'fog' },
  48: { en: 'Depositing rime fog', hi: 'घना जमाव वाला कोहरा', icon: '🌫️', condition: 'fog' },
  51: { en: 'Light drizzle', hi: 'हल्की बूंदाबांदी', icon: '🌦️', condition: 'drizzle' },
  53: { en: 'Moderate drizzle', hi: 'मध्यम बूंदाबांदी', icon: '🌦️', condition: 'drizzle' },
  55: { en: 'Dense drizzle', hi: 'घनी बूंदाबांदी', icon: '🌧️', condition: 'drizzle' },
  61: { en: 'Slight rain', hi: 'हल्की बारिश', icon: '🌧️', condition: 'rain' },
  63: { en: 'Moderate rain', hi: 'मध्यम बारिश', icon: '🌧️', condition: 'rain' },
  65: { en: 'Heavy rain', hi: 'भारी बारिश', icon: '⛈️', condition: 'rain' },
  71: { en: 'Slight snowfall', hi: 'हल्की बर्फबारी', icon: '🌨️', condition: 'snow' },
  73: { en: 'Moderate snowfall', hi: 'मध्यम बर्फबारी', icon: '🌨️', condition: 'snow' },
  75: { en: 'Heavy snowfall', hi: 'भारी बर्फबारी', icon: '❄️', condition: 'snow' },
  80: { en: 'Slight rain showers', hi: 'हल्की बौछारें', icon: '🌦️', condition: 'shower' },
  81: { en: 'Moderate rain showers', hi: 'मध्यम बौछारें', icon: '🌧️', condition: 'shower' },
  82: { en: 'Violent rain showers', hi: 'तेज मूसलाधार बौछारें', icon: '⛈️', condition: 'shower' },
  95: { en: 'Thunderstorm', hi: 'गरज के साथ तूफ़ान', icon: '⛈️', condition: 'thunderstorm' },
  96: { en: 'Thunderstorm with slight hail', hi: 'आंधी-तूफान और ओले', icon: '⛈️', condition: 'thunderstorm' },
  99: { en: 'Thunderstorm with heavy hail', hi: 'भीषण आंधी और ओलावृष्टि', icon: '⛈️', condition: 'thunderstorm' }
};

export function interpretWmoCode(code, lang = 'en') {
  const match = WMO_CODES[code] || { en: 'Moderate Weather', hi: 'सामान्य मौसम', icon: '🌤️', condition: 'unknown' };
  return {
    description: lang === 'hi' ? match.hi : match.en,
    icon: match.icon,
    condition: match.condition,
    code
  };
}

/**
 * Search for locations by city/town name
 * @param {string} query - Name of the city (e.g., 'Meerut', 'Delhi')
 * @returns {Promise<Array>} List of matching locations with lat, lon, country, admin1
 */
export async function geocodeCity(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Please enter a valid city name');
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding service error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    return [];
  }

  return data.results.map((loc) => ({
    id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    country: loc.country || '',
    countryCode: loc.country_code || '',
    admin1: loc.admin1 || '', // State or Province (e.g. Uttar Pradesh)
    timezone: loc.timezone || 'auto'
  }));
}

/**
 * Reverse geocode latitude and longitude to get human-readable location name
 * Uses BigDataCloud reverse geocode API (free, open, no auth needed)
 */
export async function reverseGeocode(latitude, longitude) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const name = data.city || data.locality || data.principalSubdivision || 'Current Location';
      const admin1 = data.principalSubdivision || '';
      const country = data.countryName || '';
      return { name, admin1, country, latitude, longitude };
    }
  } catch (err) {
    console.warn('Reverse geocode fallback failed:', err.message);
  }
  return {
    name: 'Your Location',
    admin1: '',
    country: '',
    latitude,
    longitude
  };
}

/**
 * Fetch comprehensive weather data from Open-Meteo
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} timezone - e.g., 'Asia/Kolkata' or 'auto'
 */
export async function fetchWeatherData(latitude, longitude, timezone = 'auto') {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max'
    ].join(','),
    timezone: timezone || 'auto'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo weather fetch failed: ${response.statusText}`);
  }

  const raw = await response.json();

  // Parse current weather
  const current = {
    time: raw.current.time,
    temperature: Math.round(raw.current.temperature_2m),
    feelsLike: Math.round(raw.current.apparent_temperature),
    humidity: raw.current.relative_humidity_2m,
    windSpeed: Math.round(raw.current.wind_speed_10m),
    windDirection: raw.current.wind_direction_10m,
    precipitation: raw.current.precipitation,
    weatherCode: raw.current.weather_code,
    wmo: interpretWmoCode(raw.current.weather_code)
  };

  // Parse next 24 hours (for hourly charts)
  const hourlyTimes = raw.hourly.time.slice(0, 24);
  const hourly = hourlyTimes.map((timeStr, idx) => ({
    time: timeStr,
    hourLabel: new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: Math.round(raw.hourly.temperature_2m[idx]),
    humidity: raw.hourly.relative_humidity_2m[idx],
    rainProbability: raw.hourly.precipitation_probability[idx] ?? 0,
    windSpeed: Math.round(raw.hourly.wind_speed_10m[idx]),
    weatherCode: raw.hourly.weather_code[idx],
    wmo: interpretWmoCode(raw.hourly.weather_code[idx])
  }));

  // Parse 7-day forecast
  const daily = raw.daily.time.map((dateStr, idx) => {
    const d = new Date(dateStr);
    const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNameHi = idx === 0 ? 'आज' : idx === 1 ? 'कल' : d.toLocaleDateString('hi-IN', { weekday: 'short' });

    return {
      date: dateStr,
      dayName,
      dayNameHi,
      maxTemp: Math.round(raw.daily.temperature_2m_max[idx]),
      minTemp: Math.round(raw.daily.temperature_2m_min[idx]),
      rainProbability: raw.daily.precipitation_probability_max[idx] ?? 0,
      windSpeedMax: Math.round(raw.daily.wind_speed_10m_max[idx]),
      weatherCode: raw.daily.weather_code[idx],
      wmo: interpretWmoCode(raw.daily.weather_code[idx])
    };
  });

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
    elevation: raw.elevation,
    current,
    hourly,
    daily
  };
}
