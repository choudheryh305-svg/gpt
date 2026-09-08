/**
 * Storage Module
 * Manages favorites, recent search history, theme, and language via localStorage.
 * Compatible with both ES modules and browser global script execution.
 */

const STORAGE_KEYS = {
  THEME: 'weathergpt_theme',
  LANG: 'weathergpt_lang',
  FAVORITES: 'weathergpt_favorites',
  RECENTS: 'weathergpt_recents'
};

const StorageManager = {
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANG) || 'en';
  },

  setLanguage(lang) {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  },

  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || ['Meerut', 'Delhi', 'Mumbai'];
    } catch {
      return ['Meerut', 'Delhi', 'Mumbai'];
    }
  },

  isFavorite(cityName) {
    const favs = this.getFavorites();
    return favs.some((c) => c.toLowerCase() === cityName.toLowerCase());
  },

  toggleFavorite(cityName) {
    let favs = this.getFavorites();
    const index = favs.findIndex((c) => c.toLowerCase() === cityName.toLowerCase());
    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.unshift(cityName);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    return this.isFavorite(cityName);
  },

  getRecents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTS)) || [];
    } catch {
      return [];
    }
  },

  addRecent(cityName) {
    if (!cityName) return;
    let recents = this.getRecents();
    recents = recents.filter((c) => c.toLowerCase() !== cityName.toLowerCase());
    recents.unshift(cityName);
    if (recents.length > 5) recents.pop();
    localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(recents));
  }
};

// Export for module systems and bind to window for direct browser script loading
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
