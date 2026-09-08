/**
 * Digital India BHASHINI Service (MeitY)
 * Handles Indian language ASR (Speech-to-Text), NMT (Translation), and TTS (Text-to-Speech).
 * 
 * Official BHASHINI API Specifications (Dhruva / ULCA):
 * - Auth Portal: https://bhashini.gov.in / https://ulca.bhashini.gov.in/
 * - Pipeline Inference URL: https://dhruva-api.bhashini.gov.in/services/inference/pipeline
 * - Pipeline Config URL: https://meity-auth.ulca.ai/ulca/apis/v0/model/getModelsPipeline
 * 
 * When BHASHINI credentials are not configured or are awaiting MeitY approval,
 * this service gracefully signals the frontend to use Web Speech API / browser fallback.
 */

const BHASHINI_PIPELINE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const BHASHINI_CONFIG_URL = 'https://meity-auth.ulca.ai/ulca/apis/v0/model/getModelsPipeline';

export function isBhashiniConfigured() {
  const userId = process.env.BHASHINI_USER_ID;
  const apiKey = process.env.BHASHINI_API_KEY || process.env.BHASHINI_INFERENCE_KEY;
  return Boolean(userId && apiKey);
}

/**
 * Get BHASHINI Service configuration pipeline for specified language and task
 * @param {string} taskType - 'asr' | 'translation' | 'tts'
 * @param {string} sourceLang - e.g. 'hi', 'en'
 * @param {string} targetLang - e.g. 'en', 'hi'
 */
export async function getPipelineConfig(taskType, sourceLang = 'hi', targetLang = 'en') {
  if (!isBhashiniConfigured()) {
    return { available: false, reason: 'BHASHINI credentials not configured in .env' };
  }

  const payload = {
    pipelineTasks: [
      {
        taskType,
        config: {
          language: {
            sourceLanguage: sourceLang,
            ...(targetLang ? { targetLanguage: targetLang } : {})
          }
        }
      }
    ],
    pipelineRequestConfig: {
      pipelineId: process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543d6'
    }
  };

  try {
    const response = await fetch(BHASHINI_CONFIG_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'userID': process.env.BHASHINI_USER_ID,
        'ulcaApiKey': process.env.BHASHINI_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`BHASHINI Config error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('BHASHINI Config fetch failed:', err.message);
    return { available: false, error: err.message };
  }
}

/**
 * Translate text between English and Indian Languages (via BHASHINI NMT / IndicTrans)
 */
export async function translateText(text, sourceLang = 'en', targetLang = 'hi') {
  if (sourceLang === targetLang || !text) {
    return { translatedText: text, provider: 'identity' };
  }

  if (!isBhashiniConfigured()) {
    // Graceful fallback flag: signals frontend or caller to use local translation
    return {
      translatedText: text,
      provider: 'fallback',
      message: 'BHASHINI credentials not set; showing original text with local translation mappings'
    };
  }

  try {
    const inferenceKey = process.env.BHASHINI_INFERENCE_KEY || process.env.BHASHINI_API_KEY;
    const response = await fetch(BHASHINI_PIPELINE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': inferenceKey
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
              }
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`BHASHINI Translation failed with status: ${response.status}`);
    }

    const data = await response.json();
    const output = data.pipelineResponse?.[0]?.output?.[0]?.target;
    return {
      translatedText: output || text,
      provider: 'bhashini'
    };
  } catch (err) {
    console.warn('BHASHINI Translation error:', err.message);
    return { translatedText: text, provider: 'fallback', error: err.message };
  }
}

/**
 * Perform Text-to-Speech via BHASHINI
 * Returns base64 audio content (WAV/MP3) or signals fallback
 */
export async function generateSpeech(text, language = 'hi', gender = 'female') {
  if (!isBhashiniConfigured()) {
    return {
      audioContent: null,
      provider: 'fallback',
      message: 'BHASHINI TTS not configured. Browser SpeechSynthesis will be used.'
    };
  }

  try {
    const inferenceKey = process.env.BHASHINI_INFERENCE_KEY || process.env.BHASHINI_API_KEY;
    const response = await fetch(BHASHINI_PIPELINE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': inferenceKey
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: { sourceLanguage: language },
              gender: gender
            }
          }
        ],
        inputData: {
          input: [{ source: text }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`BHASHINI TTS returned ${response.status}`);
    }

    const data = await response.json();
    const audioBase64 = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;

    return {
      audioContent: audioBase64,
      provider: 'bhashini'
    };
  } catch (err) {
    console.warn('BHASHINI TTS failed:', err.message);
    return {
      audioContent: null,
      provider: 'fallback',
      error: err.message
    };
  }
}
