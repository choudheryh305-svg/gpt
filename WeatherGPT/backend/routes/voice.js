import express from 'express';
import { isBhashiniConfigured, translateText, generateSpeech } from '../services/bhashiniService.js';

const router = express.Router();

/**
 * GET /api/voice/status
 * Returns multilingual & voice capabilities status
 */
router.get('/status', (req, res) => {
  res.json({
    bhashiniConfigured: isBhashiniConfigured(),
    supportedLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ],
    fallbackEngine: 'Web Speech API (SpeechRecognition & SpeechSynthesis)'
  });
});

/**
 * POST /api/voice/translate
 * Body: { text: string, sourceLang: string, targetLang: string }
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'en', targetLang = 'hi' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }
    const result = await translateText(text, sourceLang, targetLang);
    res.json(result);
  } catch (err) {
    console.error('Translation route error:', err.message);
    res.status(500).json({ error: 'Translation failed', details: err.message });
  }
});

/**
 * POST /api/voice/tts
 * Body: { text: string, language: string }
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, language = 'hi' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }
    const result = await generateSpeech(text, language);
    res.json(result);
  } catch (err) {
    console.error('TTS route error:', err.message);
    res.status(500).json({ error: 'TTS conversion failed', details: err.message });
  }
});

export default router;
