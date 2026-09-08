/**
 * Chatbot Module
 * Controls conversational exchange, query dispatch, data injection, and TTS triggers.
 * Self-healing: Uses window.IntentService directly if backend server is not running!
 */

const ChatbotManager = {
  init() {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const quickChips = document.querySelectorAll('.quick-chips .chip');

    // Handle form submit
    chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      this.handleUserQuestion(text);
      chatInput.value = '';
    });

    // Handle quick chips
    quickChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.q;
        if (query) {
          this.handleUserQuestion(query);
        }
      });
    });

    // Global listener for TTS buttons
    document.getElementById('chatMessages')?.addEventListener('click', (e) => {
      const listenBtn = e.target.closest('.listen-btn');
      if (listenBtn) {
        const textToSpeak = listenBtn.dataset.speech;
        const lang = listenBtn.dataset.lang || 'en';
        if (window.VoiceManager) {
          window.VoiceManager.speak(textToSpeak, lang);
        }
      }
    });
  },

  appendUserMessage(text) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    msgDiv.innerHTML = `
      <div class="message-content">
        <p>${this.escapeHtml(text)}</p>
      </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  },

  appendBotMessage(answer, recommendations = [], lang = 'en') {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';

    let recsHtml = '';
    if (recommendations && recommendations.length > 0) {
      recsHtml = `
        <div class="recommendations-box">
          <strong>💡 ${lang === 'hi' ? 'सलाह व सुझाव:' : 'Advisory & Recommendations:'}</strong>
          <ul style="margin-left: 18px; margin-top: 4px;">
            ${recommendations.map((r) => `<li>${this.escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    const speechText = `${answer} ${recommendations.join('. ')}`;

    msgDiv.innerHTML = `
      <div class="message-content">
        <p>${this.escapeHtml(answer)}</p>
        ${recsHtml}
      </div>
      <div class="message-meta">
        <button class="listen-btn" data-speech="${this.escapeHtml(speechText)}" data-lang="${lang}">
          <i class="fa-solid fa-volume-high"></i> ${lang === 'hi' ? 'सुनें' : 'Listen'}
        </button>
      </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  },

  async handleUserQuestion(question) {
    this.appendUserMessage(question);

    const lang = document.getElementById('langSelect')?.value || 'en';
    const weatherData = window.WeatherService?.getCurrentData();
    const city = window.WeatherService?.getCurrentCity();

    let result = null;

    // 1. Attempt backend assistant route if running on HTTP
    if (window.location.protocol.startsWith('http')) {
      try {
        const response = await fetch('/api/chat/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: question,
            cityName: city?.name || 'Selected City',
            weatherData: weatherData,
            lang: lang
          })
        });

        if (response.ok) {
          result = await response.json();
        }
      } catch (err) {
        console.warn('Backend chat route unavailable, using client intent engine');
      }
    }

    // 2. Client-side self-healing fallback using window.IntentService
    if (!result && window.IntentService) {
      result = window.IntentService.processQuery(question, weatherData, city?.name || 'Selected City', lang);
    }

    if (result) {
      this.appendBotMessage(result.answer, result.recommendations, result.language || lang);
    } else {
      const errorMsg = lang === 'hi'
        ? 'क्षमा करें, आपके प्रश्न का उत्तर देने में समस्या हुई। कृपया पुनः प्रयास करें।'
        : 'Sorry, I encountered an error answering your question. Please try again.';
      this.appendBotMessage(errorMsg, [], lang);
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

if (typeof window !== 'undefined') {
  window.ChatbotManager = ChatbotManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatbotManager;
}
