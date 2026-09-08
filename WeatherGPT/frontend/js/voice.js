/**
 * Voice Module
 * Handles Multilingual Speech Recognition (ASR) and Text-to-Speech (TTS)
 */

let recognition = null;
let isRecording = false;

const VoiceManager = {
  init(onResultCallback, onErrorCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Browser SpeechRecognition API is not supported in this browser.');
      return false;
    }

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.stopListening();
        if (onResultCallback) onResultCallback(transcript);
      };

      recognition.onerror = (event) => {
        this.stopListening();
        let errorMsg = 'Could not understand audio. Please try again or type your question.';
        if (event.error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow mic access or type your question.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech was detected. Please click the mic and speak clearly.';
        }
        if (onErrorCallback) onErrorCallback(errorMsg);
      };

      recognition.onend = () => {
        this.stopListening();
      };

      return true;
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
      return false;
    }
  },

  startListening(lang = 'en') {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    try {
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.start();
      isRecording = true;
      this.updateUiRecording(true);
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
    }
  },

  stopListening() {
    if (recognition && isRecording) {
      try {
        recognition.stop();
      } catch {}
    }
    isRecording = false;
    this.updateUiRecording(false);
  },

  updateUiRecording(active) {
    const micBtn = document.getElementById('micBtn');
    const banner = document.getElementById('recordingBanner');

    if (active) {
      micBtn?.classList.add('active-mic');
      banner?.classList.remove('hidden');
    } else {
      micBtn?.classList.remove('active-mic');
      banner?.classList.add('hidden');
    }
  },

  async speak(text, lang = 'en') {
    if (!text) return;

    const cleanText = text
      .replace(/[#*_~`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .trim();

    // 1. Try BHASHINI TTS if server is reachable
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, language: lang })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioContent) {
            const audio = document.getElementById('ttsAudio');
            audio.src = `data:audio/wav;base64,${data.audioContent}`;
            audio.play();
            return;
          }
        }
      } catch (err) {
        // Fallback to browser synthesis
      }
    }

    // 2. Native Web SpeechSynthesis fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => 
        lang === 'hi' ? v.lang.includes('hi') : (v.lang.includes('en-IN') || v.lang.includes('en-US'))
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
};

if (typeof window !== 'undefined') {
  window.VoiceManager = VoiceManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceManager;
}
