const DEFAULT_REPEAT_DELAY_MS = 1200;

const isBrowserAudioSupported = () =>
  typeof window !== 'undefined' && (window.Audio || window.AudioContext || window.webkitAudioContext);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let activePlayback = null;\nlet isPlaying = false;\n\nexport const getIsPlaying = () => isPlaying;\n\nexport const setIsPlaying = (playing) => { isPlaying = playing; };\n

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

  const context = new AudioContextClass();
  const playback = {
    context,
    oscillator: null,
    stop: () => {
      try {
        playback.oscillator?.stop();
      } catch {
        void 0;
      }
      try {
        context.close();
      } catch {
        void 0;
      }
    }
  };

  activePlayback = playback;

  try {
    if (context.state === 'suspended') {
      await context.resume().catch(() => void 0);
    }

    const gainNode = context.createGain();
    const oscillator = context.createOscillator();
    playback.oscillator = oscillator;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, Number(volume) || 0.8)) * 0.08, context.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.85);

    await new Promise((resolve, reject) => {
      oscillator.onended = () => resolve(true);
      playback.stop = () => {
        try {
          oscillator.stop();
        } catch {
          void 0;
        }
        try {
          context.close();
        } catch {
          void 0;
        }
        reject(new Error('Alarm stopped'));
      };
    });

    return true;
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
      if (index === 0) {
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
