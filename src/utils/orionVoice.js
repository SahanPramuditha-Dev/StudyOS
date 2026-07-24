/**
 * orionVoice.js
 * A self-contained module for Text-to-Speech (TTS) and Speech-to-Text (STT) using Web Speech API.
 */

import { generateOrionTTS } from '../services/aiService';

// --- Text to Speech (TTS) using Gemini ---

let currentAudio = null;
let isAudioPlaying = false;

// WAV conversion utilities
function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');
  const options = { numChannels: 1, sampleRate: 24000, bitsPerSample: 16 };
  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }
  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') options.sampleRate = parseInt(value, 10);
  }
  return options;
}

function createWavHeader(dataLength, options) {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  return new Uint8Array(buffer);
}

function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const OrionTTS = {
  speak: async (text, options = {}) => {
    // Clean text
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .trim();

    if (!cleanText) return;

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      isAudioPlaying = false;
    }

    try {
      if (options.onStart) options.onStart(); // Signal thinking/loading

      const response = await generateOrionTTS(cleanText);
      
      const rawData = base64ToUint8Array(response.data);
      const mimeOptions = parseMimeType(response.mimeType);
      const wavHeader = createWavHeader(rawData.length, mimeOptions);
      
      const wavBlob = new Blob([wavHeader, rawData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(wavBlob);
      
      currentAudio = new Audio(audioUrl);
      
      currentAudio.onplay = () => {
        isAudioPlaying = true;
      };
      
      currentAudio.onended = () => {
        isAudioPlaying = false;
        URL.revokeObjectURL(audioUrl);
        if (options.onEnd) options.onEnd();
      };
      
      currentAudio.onerror = (e) => {
        console.error('Audio playback error', e);
        isAudioPlaying = false;
        if (options.onError) options.onError(e);
      };

      await currentAudio.play();
    } catch (error) {
      console.error('TTS Generation failed:', error);
      isAudioPlaying = false;
      if (options.onError) options.onError(error);
    }
  },
  stop: () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      isAudioPlaying = false;
    }
  },
  isSpeaking: () => isAudioPlaying
};

// --- Speech to Text (STT) ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isCurrentlyListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false; // Push to talk
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

export const OrionSTT = {
  isSupported: () => !!SpeechRecognition,
  startListening: (onResult, onError, onEndCallback) => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      onResult({
        interim: interimTranscript,
        final: finalTranscript,
        isFinal: !!finalTranscript
      });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      isCurrentlyListening = false;
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      isCurrentlyListening = false;
      if (onEndCallback) onEndCallback();
    };

    try {
      recognition.start();
      isCurrentlyListening = true;
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      isCurrentlyListening = false;
    }
  },
  stopListening: () => {
    if (recognition && isCurrentlyListening) {
      recognition.stop();
      isCurrentlyListening = false;
    }
  },
  isListening: () => isCurrentlyListening
};
