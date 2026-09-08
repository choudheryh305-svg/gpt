import express from 'express';
import { geocodeCity, reverseGeocode, fetchWeatherData } from '../services/openMeteoService.js';

const router = express.Router();

/**
 * GET /api/weather/geocode
 * Query: city (string)
 */
router.get('/geocode', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City name query parameter is required' });
    }
    const results = await geocodeCity(city);
    if (results.length === 0) {
      return res.status(404).json({ error: `No locations found for "${city}"` });
    }
    res.json({ results });
  } catch (error) {
    console.error('Geocoding error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to search location' });
  }
});

/**
 * GET /api/weather/reverse
 * Query: lat (number), lon (number)
 */
router.get('/reverse', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
    }
    const location = await reverseGeocode(lat, lon);
    res.json(location);
  } catch (error) {
    console.error('Reverse geocode error:', error.message);
    res.status(500).json({ error: 'Failed to resolve location coordinates' });
  }
});

/**
 * GET /api/weather/forecast
 * Query: lat (number), lon (number), tz (string, optional)
 */
router.get('/forecast', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const tz = req.query.tz || 'auto';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
    }

    const weatherData = await fetchWeatherData(lat, lon, tz);
    res.json(weatherData);
  } catch (error) {
    console.error('Weather forecast fetch error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to retrieve weather data' });
  }
});

export default router;
