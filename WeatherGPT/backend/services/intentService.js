/**
 * WeatherGPT Intent & Reasoning Service
 * Strictly grounds conversational answers in real Open-Meteo weather data.
 * Supports English and Hindi queries without hallucinating unobserved metrics.
 */

// Intent patterns (bilingual regexes)
const INTENT_PATTERNS = {
  rain: /(rain|umbrella|shower|drizzle|precipitation|wet|बारिश|वर्षा|बरसात|पानी|बूंदाबांदी|छाता|छतरी)/i,
  temperature: /(temperature|temp|hot|cold|warm|heat|chill|degrees|तापमान|गर्मी|सर्दी|ठंड|कितना गर्म|पारा)/i,
  humidity: /(humidity|humid|moisture|muggy|sweat|नमी|आर्द्रता|उमस)/i,
  wind: /(wind|breeze|gust|storm|gale|हवा|पवन|आंधी|तूफान)/i,
  outdoor: /(outdoor|outside|cricket|play|walk|run|picnic|activity|match|travel|बाहर|घूमने|खेलने|सैर|पिकनिक)/i,
  evening: /(evening|tonight|night|dusk|शाम|रात|आज शाम)/i,
  farmer: /(farmer|crop|field|farming|agriculture|harvest|sowing|किसान|खेती|फसल|सिंचाई|बुवाई|कटाई)/i,
  recommendations: /(advice|recommendation|tips|precaution|alert|चेतावनी|सलाह|सुझाव)/i
};

const TIMEFRAME_PATTERNS = {
  tomorrow: /(tomorrow|next day|कल|आने वाला कल)/i,
  today: /(today|currently|now|right now|this afternoon|आज|अभी|इस वक्त)/i,
  evening: /(evening|tonight|night|शाम|रात)/i
};

/**
 * Generate a grounded conversational response to a weather query
 * @param {string} query - User question in English or Hindi
 * @param {object} weatherData - Current, hourly, and daily Open-Meteo data
 * @param {string} cityName - Name of the selected location
 * @param {string} lang - 'en' or 'hi'
 * @returns {object} { answer, recommendations, alerts }
 */
export function processWeatherQuery(query, weatherData, cityName = 'this location', lang = 'en') {
  if (!weatherData || !weatherData.current) {
    return {
      answer: lang === 'hi' 
        ? 'क्षमा करें, मौसम डेटा अभी उपलब्ध नहीं है। कृपया पहले किसी शहर का चयन करें।'
        : 'Sorry, weather data is not currently available. Please select a city first.',
      recommendations: [],
      alerts: []
    };
  }

  const q = (query || '').toLowerCase().trim();
  const current = weatherData.current;
  const today = weatherData.daily?.[0] || {};
  const tomorrow = weatherData.daily?.[1] || {};
  const isHi = lang === 'hi' || /[\u0900-\u097F]/.test(q); // Auto-detect Hindi script
  const effectiveLang = isHi ? 'hi' : 'en';

  // Determine timeframe
  const isTomorrow = TIMEFRAME_PATTERNS.tomorrow.test(q);
  const isEvening = TIMEFRAME_PATTERNS.evening.test(q);

  let answer = '';
  const recommendations = [];
  const alerts = [];

  // Evaluate alerts from data
  generateSystemAlerts(current, today, alerts, effectiveLang);

  // Intent 1: Rain & Umbrella
  if (INTENT_PATTERNS.rain.test(q)) {
    if (isTomorrow) {
      const rainProb = tomorrow.rainProbability ?? 0;
      if (effectiveLang === 'hi') {
        answer = `कल ${cityName} में बारिश की संभावना ${rainProb}% है। मौसम स्थिति: ${tomorrow.wmo?.description || 'सामान्य'}।`;
        if (rainProb >= 40) {
          recommendations.push('कल बाहर जाते समय छाता साथ रखना समझदारी होगी।');
        } else {
          recommendations.push('कल भारी बारिश की संभावना कम दिखाई दे रही है।');
        }
      } else {
        answer = `Tomorrow in ${cityName}, the maximum chance of rain is ${rainProb}%, with ${tomorrow.wmo?.description || 'moderate conditions'}.`;
        if (rainProb >= 40) {
          recommendations.push('Consider carrying an umbrella or raincoat tomorrow.');
        } else {
          recommendations.push('Rain probability is low, so outdoor plans should generally be fine.');
        }
      }
    } else {
      const currentRain = current.precipitation || 0;
      const todayRainProb = today.rainProbability ?? 0;
      if (effectiveLang === 'hi') {
        answer = `आज ${cityName} में बारिश की अधिकतम संभावना ${todayRainProb}% है। वर्तमान वर्षा दर ${currentRain} mm है और आसमान में ${current.wmo?.description || 'बादल'} हैं।`;
        if (todayRainProb >= 50 || currentRain > 0) {
          recommendations.push('बारिश के आसार हैं, छाता साथ अवश्य रखें।');
        } else {
          recommendations.push('आज दिन में छाते की खास आवश्यकता नहीं जान पड़ती।');
        }
      } else {
        answer = `In ${cityName} today, the rain probability is up to ${todayRainProb}%. Current precipitation is ${currentRain} mm with ${current.wmo?.description || 'clear skies'}.`;
        if (todayRainProb >= 50 || currentRain > 0) {
          recommendations.push('It is advisable to carry an umbrella today.');
        } else {
          recommendations.push('Rain is unlikely to disrupt your routine today.');
        }
      }
    }
  }

  // Intent 2: Temperature & Heat/Cold
  else if (INTENT_PATTERNS.temperature.test(q)) {
    if (isTomorrow) {
      if (effectiveLang === 'hi') {
        answer = `कल ${cityName} में अधिकतम तापमान ${tomorrow.maxTemp}°C और न्यूनतम तापमान ${tomorrow.minTemp}°C रहने का अनुमान है।`;
      } else {
        answer = `Tomorrow in ${cityName}, the temperature is expected to reach a high of ${tomorrow.maxTemp}°C and a low of ${tomorrow.minTemp}°C.`;
      }
    } else {
      if (effectiveLang === 'hi') {
        answer = `वर्तमान में ${cityName} में तापमान ${current.temperature}°C है (महसूस: ${current.feelsLike}°C)। आज का अधिकतम तापमान ${today.maxTemp}°C और न्यूनतम ${today.minTemp}°C रहेगा।`;
        if (today.maxTemp >= 38) {
          recommendations.push('आज तेज धूप और गर्मी रहेगी। पर्याप्त पानी पिएं और सीधी धूप से बचें।');
        } else if (today.minTemp <= 10) {
          recommendations.push('मौसम ठंडा रहेगा, गर्म कपड़े पहनना उपयुक्त रहेगा।');
        }
      } else {
        answer = `Currently in ${cityName}, it is ${current.temperature}°C (feels like ${current.feelsLike}°C). Today's forecast is between ${today.minTemp}°C and ${today.maxTemp}°C.`;
        if (today.maxTemp >= 38) {
          recommendations.push('High temperatures expected today. Stay well-hydrated and avoid midday sun.');
        } else if (today.minTemp <= 10) {
          recommendations.push('Chilly conditions expected, keep warm layers handy.');
        }
      }
    }
  }

  // Intent 3: Humidity
  else if (INTENT_PATTERNS.humidity.test(q)) {
    if (effectiveLang === 'hi') {
      answer = `वर्तमान में ${cityName} में सापेक्ष आर्द्रता (नमी) ${current.humidity}% है।`;
      if (current.humidity >= 80) {
        recommendations.push('हवा में नमी अधिक है, जिससे उमस महसूस हो सकती है।');
      }
    } else {
      answer = `The relative humidity in ${cityName} is currently ${current.humidity}%.`;
      if (current.humidity >= 80) {
        recommendations.push('High moisture levels may make it feel muggy and sticky.');
      }
    }
  }

  // Intent 4: Wind
  else if (INTENT_PATTERNS.wind.test(q)) {
    if (effectiveLang === 'hi') {
      answer = `वर्तमान में ${cityName} में हवा की गति ${current.windSpeed} किमी/घंटा है (दिशा: ${current.windDirection}°)। आज अधिकतम हवा ${today.windSpeedMax || current.windSpeed} किमी/घंटा तक जा सकती है।`;
      if (current.windSpeed >= 30) {
        recommendations.push('हवा की गति काफी तेज है, खुले में सावधानी बरतें।');
      }
    } else {
      answer = `Wind speed in ${cityName} is currently ${current.windSpeed} km/h (direction: ${current.windDirection}°), with peak gusts up to ${today.windSpeedMax || current.windSpeed} km/h today.`;
      if (current.windSpeed >= 30) {
        recommendations.push('Noticeably windy conditions; secure loose outdoor objects.');
      }
    }
  }

  // Intent 5: Evening Forecast
  else if (isEvening) {
    // Find hourly data around 18:00 - 21:00
    const eveningHour = weatherData.hourly?.find((h) => {
      const hour = new Date(h.time).getHours();
      return hour >= 18 && hour <= 21;
    }) || weatherData.hourly?.[18] || current;

    if (effectiveLang === 'hi') {
      answer = `आज शाम ${cityName} में तापमान लगभग ${eveningHour.temperature}°C रहने का अनुमान है, बारिश की संभावना ${eveningHour.rainProbability}% तथा स्थिति '${eveningHour.wmo?.description || 'शांत'}' रहेगी।`;
    } else {
      answer = `This evening in ${cityName}, expect temperatures around ${eveningHour.temperature}°C, rain probability of ${eveningHour.rainProbability}%, and ${eveningHour.wmo?.description || 'fair conditions'}.`;
    }
  }

  // Intent 6: Outdoor Activity Suitability
  else if (INTENT_PATTERNS.outdoor.test(q)) {
    const targetDay = isTomorrow ? tomorrow : today;
    const rainP = targetDay.rainProbability ?? 0;
    const maxT = targetDay.maxTemp ?? 30;
    const wind = targetDay.windSpeedMax ?? 15;

    const isFavorable = rainP < 35 && maxT < 40 && wind < 35;

    if (effectiveLang === 'hi') {
      if (isFavorable) {
        answer = `${isTomorrow ? 'कल' : 'आज'} ${cityName} में बाहरी गतिविधियों के लिए मौसम सामान्यतः अनुकूल है (बारिश: ${rainP}%, अधिकतम तापमान: ${maxT}°C)।`;
        recommendations.push('बाहरी खेल, यात्रा या सैर के लिए अच्छा समय है।');
      } else {
        answer = `${isTomorrow ? 'कल' : 'आज'} मौसम बाहरी गतिविधियों को प्रभावित कर सकता है (बारिश की संभावना: ${rainP}%, तापमान: ${maxT}°C, हवा: ${wind} किमी/घंटा)।`;
        recommendations.push('यदि बाहर जा रहे हैं तो मौसम के बदलाव के लिए तैयार रहें।');
      }
    } else {
      if (isFavorable) {
        answer = `Weather in ${cityName} looks favorable for outdoor activities ${isTomorrow ? 'tomorrow' : 'today'} (Rain chance: ${rainP}%, High: ${maxT}°C).`;
        recommendations.push('A pleasant window for sports, walks, or travel.');
      } else {
        answer = `Weather might not be optimal for prolonged outdoor plans ${isTomorrow ? 'tomorrow' : 'today'} (Rain chance: ${rainP}%, High: ${maxT}°C, Wind: ${wind} km/h).`;
        recommendations.push('Keep an eye on conditions and have an indoor contingency plan.');
      }
    }
  }

  // Intent 7: Farmer & Rural User Advisory
  else if (INTENT_PATTERNS.farmer.test(q)) {
    const rainP = today.rainProbability ?? 0;
    const nextRainP = tomorrow.rainProbability ?? 0;
    if (effectiveLang === 'hi') {
      answer = `किसान मित्रों के लिए ${cityName} का मौसम अपडेट: आज अधिकतम तापमान ${today.maxTemp}°C तथा बारिश की संभावना ${rainP}% है। कल बारिश की संभावना ${nextRainP}% रहेगी।`;
      if (rainP >= 50 || nextRainP >= 50) {
        recommendations.push('आगामी बारिश को देखते हुए कटी हुई फसल को सुरक्षित स्थान पर रखें और कीटनाशक छिड़काव रोक दें।');
      } else {
        recommendations.push('मौसम शुष्क रहने का अनुमान है, सामान्य सिंचाई और कृषि कार्य जारी रखे जा सकते हैं।');
      }
    } else {
      answer = `Agricultural advisory for ${cityName}: Today's high is ${today.maxTemp}°C with ${rainP}% rain probability. Tomorrow's rain chance is ${nextRainP}%.`;
      if (rainP >= 50 || nextRainP >= 50) {
        recommendations.push('Rain expected: Shield harvested produce and postpone pesticide/fertilizer spraying.');
      } else {
        recommendations.push('Relatively dry conditions; routine field operations and irrigation can proceed.');
      }
    }
  }

  // Fallback / General Summary
  else {
    if (effectiveLang === 'hi') {
      answer = `${cityName} में वर्तमान तापमान ${current.temperature}°C है और मौसम '${current.wmo?.description || 'साफ'}' है। आज तापमान ${today.minTemp}°C से ${today.maxTemp}°C के बीच रहेगा, हवा की गति ${current.windSpeed} किमी/घंटा और बारिश की संभावना ${today.rainProbability}% है।`;
      recommendations.push('आप मुझसे बारिश, तापमान, हवा, उमस, या कल के मौसम के बारे में पूछ सकते हैं।');
    } else {
      answer = `In ${cityName}, it is currently ${current.temperature}°C with ${current.wmo?.description || 'clear skies'}. Today's range is ${today.minTemp}°C to ${today.maxTemp}°C, wind at ${current.windSpeed} km/h, and rain chance at ${today.rainProbability}%.`;
      recommendations.push('You can ask me about rain, umbrella advice, temperature peaks, wind, or tomorrow\'s forecast.');
    }
  }

  return {
    answer,
    recommendations,
    alerts,
    cityName,
    language: effectiveLang
  };
}

/**
 * Generate automatic system alerts based strictly on weather thresholds
 */
function generateSystemAlerts(current, today, alerts, lang) {
  const isHi = lang === 'hi';

  // Rain Alert
  if ((today.rainProbability ?? 0) >= 60 || (current.precipitation ?? 0) > 2) {
    alerts.push({
      type: 'rain',
      severity: 'warning',
      title: isHi ? 'भारी वर्षा की संभावना' : 'High Rain Probability',
      message: isHi 
        ? `आज ${today.rainProbability}% तक बारिश की संभावना है। सावधानी बरतें।`
        : `Rain probability peaks at ${today.rainProbability}% today. Expect showers.`
    });
  }

  // Heat Alert
  if ((today.maxTemp ?? 0) >= 40) {
    alerts.push({
      type: 'heat',
      severity: 'danger',
      title: isHi ? 'अत्यधिक गर्मी चेतावनी' : 'High Temperature Alert',
      message: isHi
        ? `तापमान ${today.maxTemp}°C तक पहुंचने का अनुमान है। धूप से बचें।`
        : `Temperatures reaching up to ${today.maxTemp}°C. Stay hydrated and avoid peak sun.`
    });
  }

  // Wind Alert
  if ((current.windSpeed ?? 0) >= 35 || (today.windSpeedMax ?? 0) >= 40) {
    alerts.push({
      type: 'wind',
      severity: 'warning',
      title: isHi ? 'तेज हवाओं की चेतावनी' : 'Elevated Wind Warning',
      message: isHi
        ? `हवा की गति ${(today.windSpeedMax || current.windSpeed)} किमी/घंटा तक पहुंच सकती है।`
        : `Wind gusts may reach up to ${(today.windSpeedMax || current.windSpeed)} km/h today.`
    });
  }
}
