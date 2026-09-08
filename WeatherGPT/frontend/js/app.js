/**
 * Main Application Coordinator
 * Handles internationalization, theme toggling, search, favorites, geolocation, and initialization.
 * Zero-CORS, dual-mode runner compatible with both file:// direct open and http:// backend.
 */

// Bilingual UI Text Dictionary
const I18N = {
  en: {
    tagline: 'Intelligent Multilingual Weather Assistant',
    searchBtn: 'Search',
    currentLoc: 'My Location',
    favorites: 'Favorites:',
    recents: 'Recent:',
    noFavs: 'No saved cities',
    noRecents: 'None',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    wind: 'Wind',
    rainProb: 'Rain Probability',
    dailyRange: "Today's Range",
    forecastTitle: '7-Day Forecast',
    chartsTitle: 'Hourly Trends (Next 24 Hours)',
    tempTab: 'Temperature',
    rainTab: 'Rain %',
    windTab: 'Wind Speed',
    tryAsking: 'Try asking:',
    listening: 'Listening... Speak in Hindi or English',
    accuracyNote: 'Real-time calculations grounded on Open-Meteo. No fabricated figures.',
    searchPlaceholder: 'Search Indian or global city (e.g., Meerut, Delhi, Mumbai)...',
    chatPlaceholder: 'Ask a weather question (e.g., "Will it rain tomorrow?")...'
  },
  hi: {
    tagline: 'बुद्धिमान बहुभाषी मौसम सहायक',
    searchBtn: 'खोजें',
    currentLoc: 'मेरा स्थान',
    favorites: 'पसंदीदा:',
    recents: 'हालिया खोजें:',
    noFavs: 'कोई सहेजा शहर नहीं',
    noRecents: 'कोई नहीं',
    feelsLike: 'महसूस',
    humidity: 'आर्द्रता (नमी)',
    wind: 'हवा की गति',
    rainProb: 'बारिश की संभावना',
    dailyRange: 'आज का दायरा',
    forecastTitle: '7-दिवसीय पूर्वानुमान',
    chartsTitle: 'घंटेवार मौसम रुझान (अगले 24 घंटे)',
    tempTab: 'तापमान',
    rainTab: 'वर्षा %',
    windTab: 'हवा की गति',
    tryAsking: 'इनमें से पूछें:',
    listening: 'सुन रहा हूँ... हिन्दी या अंग्रेजी में बोलें',
    accuracyNote: 'Open-Meteo के वास्तविक डेटा पर आधारित। कोई फर्जी आंकड़े नहीं।',
    searchPlaceholder: 'शहर का नाम खोजें (जैसे मेरठ, दिल्ली, लखनऊ, मुंबई)...',
    chatPlaceholder: 'मौसम से जुड़ा प्रश्न पूछें (जैसे: "कल बारिश होगी क्या?")...'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Theme
  initTheme();

  // 2. Initialize Language
  initLanguage();

  // 3. Initialize Charts & Chatbot
  if (window.WeatherCharts) window.WeatherCharts.init();
  if (window.ChatbotManager) window.ChatbotManager.init();

  // 4. Initialize Voice Controller
  initVoice();

  // 5. Initialize Search, Geolocation & Favorites
  initSearchAndGeo();
  renderFavorites();
  renderRecents();

  // 6. Check Voice & BHASHINI backend status
  checkBackendStatus();

  // 7. Load Default City (Meerut)
  await loadCityByName('Meerut');
});

/**
 * Theme Toggle logic
 */
function initTheme() {
  const currentTheme = window.StorageManager ? window.StorageManager.getTheme() : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  const themeBtn = document.getElementById('themeToggle');
  themeBtn?.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (window.StorageManager) window.StorageManager.setTheme(nextTheme);
    updateThemeIcon(nextTheme);
    if (window.WeatherCharts) window.WeatherCharts.render();
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

/**
 * Language Switcher logic
 */
function initLanguage() {
  const langSelect = document.getElementById('langSelect');
  const savedLang = window.StorageManager ? window.StorageManager.getLanguage() : 'en';
  if (langSelect) {
    langSelect.value = savedLang;
    applyLanguage(savedLang);

    langSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (window.StorageManager) window.StorageManager.setLanguage(selected);
      applyLanguage(selected);

      // Re-render current weather with updated language text
      const currentCity = window.WeatherService?.getCurrentCity();
      const currentData = window.WeatherService?.getCurrentData();
      if (currentCity && currentData) {
        window.WeatherService.renderDashboard(currentCity, currentData, selected);
      }
    });
  }
}

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.en;

  // Update elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Update placeholders
  const cityInput = document.getElementById('cityInput');
  if (cityInput && dict.searchPlaceholder) cityInput.placeholder = dict.searchPlaceholder;

  const chatInput = document.getElementById('chatInput');
  if (chatInput && dict.chatPlaceholder) chatInput.placeholder = dict.chatPlaceholder;
}

/**
 * Voice System Initialization
 */
function initVoice() {
  const micBtn = document.getElementById('micBtn');
  const cancelBtn = document.getElementById('cancelVoiceBtn');

  if (!window.VoiceManager) return;

  window.VoiceManager.init(
    // onResult
    (transcript) => {
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.value = transcript;
      }
      if (window.ChatbotManager) {
        window.ChatbotManager.handleUserQuestion(transcript);
      }
    },
    // onError
    (errorMsg) => {
      const lang = window.StorageManager ? window.StorageManager.getLanguage() : 'en';
      if (window.ChatbotManager) {
        window.ChatbotManager.appendBotMessage(`⚠️ ${errorMsg}`, [], lang);
      }
    }
  );

  micBtn?.addEventListener('click', () => {
    const lang = window.StorageManager ? window.StorageManager.getLanguage() : 'en';
    window.VoiceManager.startListening(lang);
  });

  cancelBtn?.addEventListener('click', () => {
    window.VoiceManager.stopListening();
  });
}

/**
 * Search and Geolocation Setup
 */
function initSearchAndGeo() {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('cityInput');
  const resultsDropdown = document.getElementById('searchResults');
  const geoBtn = document.getElementById('geoBtn');
  const favoriteBtn = document.getElementById('favoriteBtn');

  // Form search submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    resultsDropdown.classList.add('hidden');
    await loadCityByName(q);
  });

  // Live autocomplete debounce search
  let debounceTimeout = null;
  input?.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(debounceTimeout);
    if (q.length < 2) {
      resultsDropdown.classList.add('hidden');
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        if (!window.WeatherService) return;
        const locations = await window.WeatherService.searchCity(q);
        if (locations.length === 0) {
          resultsDropdown.classList.add('hidden');
          return;
        }

        resultsDropdown.innerHTML = locations.map((loc) => `
          <div class="search-dropdown-item" data-lat="${loc.latitude}" data-lon="${loc.longitude}" data-name="${loc.name}" data-admin="${loc.admin1}" data-country="${loc.country}" data-tz="${loc.timezone}">
            <div>
              <span class="city-title">${loc.name}</span>
              <span class="city-admin">${[loc.admin1, loc.country].filter(Boolean).join(', ')}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-muted"></i>
          </div>
        `).join('');

        resultsDropdown.classList.remove('hidden');
      } catch (err) {
        resultsDropdown.classList.add('hidden');
      }
    }, 300);
  });

  // Dropdown item selection
  resultsDropdown?.addEventListener('click', async (e) => {
    const item = e.target.closest('.search-dropdown-item');
    if (!item) return;

    const cityObj = {
      name: item.dataset.name,
      admin1: item.dataset.admin,
      country: item.dataset.country,
      latitude: parseFloat(item.dataset.lat),
      longitude: parseFloat(item.dataset.lon),
      timezone: item.dataset.tz
    };

    resultsDropdown.classList.add('hidden');
    input.value = '';
    await loadCityByObject(cityObj);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target) && !resultsDropdown.contains(e.target)) {
      resultsDropdown.classList.add('hidden');
    }
  });

  // Browser Geolocation
  geoBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    geoBtn.classList.add('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        geoBtn.classList.remove('loading');
        const lang = window.StorageManager ? window.StorageManager.getLanguage() : 'en';
        if (window.WeatherService) {
          await window.WeatherService.loadCoordinatesWeather(pos.coords.latitude, pos.coords.longitude, lang);
          updateFavoriteButtonState();
          renderFavorites();
        }
      },
      (err) => {
        geoBtn.classList.remove('loading');
        let msg = 'Could not retrieve your location. Falling back to city search.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can search your city above.';
        }
        alert(msg);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });

  // Star / Favorite button
  favoriteBtn?.addEventListener('click', () => {
    const currentCity = window.WeatherService?.getCurrentCity();
    if (!currentCity || !currentCity.name) return;
    if (window.StorageManager) {
      window.StorageManager.toggleFavorite(currentCity.name);
      updateFavoriteButtonState();
      renderFavorites();
    }
  });
}

/**
 * Load city by text search
 */
async function loadCityByName(cityName) {
  const lang = window.StorageManager ? window.StorageManager.getLanguage() : 'en';
  try {
    if (!window.WeatherService) return;
    const results = await window.WeatherService.searchCity(cityName);
    if (!results || results.length === 0) {
      alert(`City "${cityName}" not found. Please check spelling.`);
      return;
    }
    await loadCityByObject(results[0]);
  } catch (err) {
    console.error('Error loading city:', err);
    alert(`Could not retrieve weather for "${cityName}": ${err.message}`);
  }
}

/**
 * Load city by complete metadata object
 */
async function loadCityByObject(cityObj) {
  const lang = window.StorageManager ? window.StorageManager.getLanguage() : 'en';
  try {
    if (!window.WeatherService) return;
    await window.WeatherService.loadCityWeather(cityObj, lang);
    if (window.StorageManager) {
      window.StorageManager.addRecent(cityObj.name);
      renderRecents();
      updateFavoriteButtonState();
    }
  } catch (err) {
    console.error('Failed to load weather:', err);
  }
}

/**
 * Render Favorites Chips
 */
function renderFavorites() {
  const container = document.getElementById('favoritesList');
  if (!container || !window.StorageManager) return;

  const favs = window.StorageManager.getFavorites();
  if (favs.length === 0) {
    container.innerHTML = `<span class="empty-chip" data-i18n="noFavs">No saved cities</span>`;
    return;
  }

  container.innerHTML = favs.map((city) => `
    <button class="city-chip" data-city="${city}">
      <i class="fa-solid fa-star text-gold"></i> ${city}
    </button>
  `).join('');

  container.querySelectorAll('.city-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadCityByName(btn.dataset.city);
    });
  });
}

/**
 * Render Recent Searches Chips
 */
function renderRecents() {
  const container = document.getElementById('recentsList');
  if (!container || !window.StorageManager) return;

  const recents = window.StorageManager.getRecents();
  if (recents.length === 0) {
    container.innerHTML = `<span class="empty-chip" data-i18n="noRecents">None</span>`;
    return;
  }

  container.innerHTML = recents.map((city) => `
    <button class="city-chip" data-city="${city}">
      <i class="fa-solid fa-clock-rotate-left"></i> ${city}
    </button>
  `).join('');

  container.querySelectorAll('.city-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadCityByName(btn.dataset.city);
    });
  });
}

/**
 * Updates favorite star appearance
 */
function updateFavoriteButtonState() {
  const btn = document.getElementById('favoriteBtn');
  const city = window.WeatherService?.getCurrentCity();
  if (!btn || !city || !window.StorageManager) return;

  const isFav = window.StorageManager.isFavorite(city.name);
  const icon = btn.querySelector('i');
  if (isFav) {
    btn.classList.add('starred');
    icon.className = 'fa-solid fa-star';
  } else {
    btn.classList.remove('starred');
    icon.className = 'fa-regular fa-star';
  }
}

/**
 * Check backend voice and BHASHINI status
 */
async function checkBackendStatus() {
  if (!window.location.protocol.startsWith('http')) return;
  try {
    const res = await fetch('/api/voice/status');
    if (res.ok) {
      const data = await res.json();
      const label = document.getElementById('voiceEngineLabel');
      if (label) {
        label.textContent = data.bhashiniConfigured 
          ? 'Digital India BHASHINI' 
          : 'Web Voice Engine (Fallback Active)';
      }
    }
  } catch (err) {
    console.warn('Voice status check skipped:', err);
  }
}
