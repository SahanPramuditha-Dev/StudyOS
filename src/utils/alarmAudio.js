const DEFAULT_REPEAT_DELAY_MS = 1200;

const isBrowserAudioSupported = () =>
  typeof window !== 'undefined' && (window.Audio || window.AudioContext || window.webkitAudioContext);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let activePlayback = null;
let isPlaying = false;

export const getIsPlaying = () => isPlaying;

export const setIsPlaying = (playing) => { isPlaying = playing; };

const clearActivePlayback = () => {
  activePlayback = null;
};

export const stopAlarmSound = () => {
  if (!activePlayback) return false;

  const playback = activePlayback;
  clearActivePlayback();

  try {
    playback.stop?.();
  } catch {
    void 0;
  }

  return true;
};

const playAudioElement = (src, volume = 0.8) => new Promise((resolve, reject) => {
  const audio = new Audio(src);
  let settled = false;

  const finish = (fn, value) => {
    if (settled) return;
    settled = true;
    if (activePlayback?.audio === audio) {
      clearActivePlayback();
    }
    fn(value);
  };

  const playback = {
    audio,
    stop: () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        void 0;
      }
      finish(reject, new Error('Alarm stopped'));
    }
  };

  activePlayback = playback;
  audio.preload = 'auto';
  audio.volume = Math.max(0, Math.min(1, Number(volume) || 0.8));
  audio.onended = () => finish(resolve, true);
  audio.onerror = () => finish(reject, new Error('Unable to load alarm sound'));

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.catch((error) => finish(reject, error));
  }
});

const playToneFallback = async (volume = 0.8) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;

  let context;
  try {
    context = new AudioContextClass();
  } catch {
    return false;
  }

  const playback = {
    context,
    oscillators: [],
    gainNodes: [],
    stop: () => {
      playback.oscillators.forEach(osc => {
        try { osc.stop(); } catch (err) { void err; }
      });
      try { context.close(); } catch (err) { void err; }
    }
  };

  activePlayback = playback;

  try {
    if (context.state === 'suspended') {
      await context.resume().catch(() => void 0);
    }

    const dest = context.destination;
    const now = context.currentTime;
    const targetVolume = Math.max(0, Math.min(1, Number(volume) || 0.8));

    // Construct a premium electronic chime sound using 3 additive harmonic frequencies
    // 523.25 Hz (C5) fundamental, 659.25 Hz (E5) major third, and 783.99 Hz (G5) perfect fifth
    const harmonics = [523.25, 659.25, 783.99];
    const relativeVolumes = [0.4, 0.25, 0.15]; // Higher frequencies fade faster and are quieter

    harmonics.forEach((freq, idx) => {
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Sound Envelope: Soft attack, exponential decay for bell ringing effect
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(relativeVolumes[idx] * targetVolume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 - (idx * 0.2)); // Higher harmonics decay faster

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 1.2);

      playback.oscillators.push(osc);
      playback.gainNodes.push(gain);
    });

    await new Promise((resolve, reject) => {
      if (playback.oscillators.length > 0) {
        playback.oscillators[0].onended = () => resolve(true);
      } else {
        resolve(true);
      }
      
      const originalStop = playback.stop;
      playback.stop = () => {
        originalStop();
        reject(new Error('Alarm stopped'));
      };
    });

    return true;
  } catch (error) {
    return false;
  } finally {
    if (activePlayback === playback) {
      clearActivePlayback();
    }
    try {
      await context.close();
    } catch {
      void 0;
    }
  }
};

export const playAlarmSound = async ({
  soundUrl = '',
  volume = 0.8,
  repeatCount = 1,
  repeatDelayMs = DEFAULT_REPEAT_DELAY_MS,
  muted = false
} = {}) => {
  if (muted || !isBrowserAudioSupported()) return { played: false, reason: 'muted_or_unsupported' };

  const plays = Math.max(1, Number(repeatCount) || 1);
  stopAlarmSound();

  for (let index = 0; index < plays; index += 1) {
    try {
      if (soundUrl) {
        await playAudioElement(soundUrl, volume);
      } else {
        await playToneFallback(volume);
      }
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('alarm stopped')) {
        return { played: false, reason: 'stopped' };
      }
      if (index === 0 && !soundUrl) {
        await playToneFallback(volume).catch(() => void 0);
      }
      return { played: index > 0, error: error?.message || 'Failed to play alarm sound' };
    }

    if (index < plays - 1) {
      await delay(Math.max(250, Number(repeatDelayMs) || DEFAULT_REPEAT_DELAY_MS));
    }
  }

  return { played: true };
};

export const canPlayBrowserAudio = () => isBrowserAudioSupported();
