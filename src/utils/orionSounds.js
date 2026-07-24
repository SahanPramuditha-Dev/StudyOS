// Simple Web Audio API synthesizer for zero-dependency UI sounds



let audioCtx = null;
let userInteracted = false;
let isMuted = false;

export const setOrionMuted = (muted) => {
  isMuted = muted;
};

if (typeof document !== 'undefined') {
  const markInteracted = () => {
    userInteracted = true;
    ['click', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, markInteracted));
  };
  ['click', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, markInteracted));
}

// Generic synthesizer function with safe context initialization
const playTone = (freq, type, duration, vol) => {
  try {
    if (isMuted) return;
    // Only initialize and play if user has interacted with the document
    if (!userInteracted || typeof window === 'undefined') return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => void 0);
      if (audioCtx.state === 'suspended') return;
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Envelope: Soft attack, exponential decay to prevent pops/clicks
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol * 0.05, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Fail silently to prevent console spam
  }
};

export const orionSounds = {
  pop: () => {
    // Ultra-soft bubble pop (C5)
    playTone(523.25, 'sine', 0.08, 0.15);
  },
  
  messageSent: () => {
    // Soft upward warm sweep
    playTone(440, 'sine', 0.12, 0.1);
  },
  
  messageReceived: () => {
    // Soft downward warm sweep
    playTone(392, 'sine', 0.15, 0.12);
  },
  
  levelUp: () => {
    // Sparkly warm pentatonic chime sequence
    playTone(523.25, 'sine', 0.25, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.25, 0.08), 80); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.35, 0.08), 160); // G5
  },
  
  alert: () => {
    // Warm warning note (two consecutive soft triangle tones)
    playTone(329.63, 'triangle', 0.2, 0.05); // E4
    setTimeout(() => playTone(329.63, 'triangle', 0.2, 0.05), 180);
  },

  micOn: () => {
    // Short ascending two-note chime
    playTone(440, 'sine', 0.1, 0.1); // A4
    setTimeout(() => playTone(554.37, 'sine', 0.15, 0.1), 100); // C#5
  },

  micOff: () => {
    // Short descending two-note chime
    playTone(554.37, 'sine', 0.1, 0.1); // C#5
    setTimeout(() => playTone(440, 'sine', 0.15, 0.1), 100); // A4
  },
  purr: () => {
    // Low frequency purring sound (120Hz sine wave)
    playTone(120, 'sine', 0.15, 0.25);
  }
};

