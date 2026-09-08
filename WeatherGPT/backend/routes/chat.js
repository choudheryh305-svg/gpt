import express from 'express';
import { processWeatherQuery } from '../services/intentService.js';
import { geocodeCity, fetchWeatherData } from '../services/openMeteoService.js';

const router = express.Router();

/**
 * POST /api/chat/ask
 * Body:
 * {
 *   query: string,
 *   cityName: string (optional if weatherData is supplied),
 *   weatherData: object (optional, will fetch if missing),
 *   lang: 'en' | 'hi'
 * }
 */
router.post('/ask', async (req, res) => {
  try {
    const { query, lang = 'en' } = req.body;
    let { weatherData, cityName } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query string is required' });
    }

    // If weather data was not directly supplied by client, fetch it using cityName
    if (!weatherData && cityName) {
      const geoResults = await geocodeCity(cityName);
      if (geoResults.length > 0) {
        const topLoc = geoResults[0];
        cityName = `${topLoc.name}${topLoc.admin1 ? ', ' + topLoc.admin1 : ''}`;
        weatherData = await fetchWeatherData(topLoc.latitude, topLoc.longitude, topLoc.timezone);
      }
    }

    const result = processWeatherQuery(query, weatherData, cityName || 'Selected Location', lang);
    res.json(result);
  } catch (error) {
    console.error('Chat endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to process assistant request' });
  }
});

export default router;
