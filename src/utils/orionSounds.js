// Simple Web Audio API synthesizer for zero-dependency UI sounds



// Generic synthesizer function with safe context initialization
const playTone = (freq, type, duration, vol) => {
  try {
    // Only initialize and play if user has interacted with the document
    if (typeof document !== 'undefined' && !document.body) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      // Don't force resume if autoplay-blocked; fail silently
      ctx.resume().catch(() => void 0);
    }
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Envelope: Soft attack, exponential decay to prevent pops/clicks
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol * 0.05, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
    
    osc.onended = () => {
      try { ctx.close(); } catch {}
    };
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
  }
};
