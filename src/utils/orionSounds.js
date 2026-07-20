// Simple Web Audio API synthesizer for zero-dependency UI sounds

let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Generic synthesizer function
const playTone = (freq, type, duration, vol) => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
};

export const orionSounds = {
  pop: () => {
    // Soft pop for opening chat / small actions
    playTone(600, 'sine', 0.1, 0.2);
  },
  
  messageSent: () => {
    // Upward blip
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e){}
  },

  messageReceived: () => {
    // Downward blip
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch(e){}
  },

  levelUp: () => {
    // Happy chord chime
    playTone(440, 'sine', 0.5, 0.1); // A4
    setTimeout(() => playTone(554.37, 'sine', 0.5, 0.1), 100); // C#5
    setTimeout(() => playTone(659.25, 'sine', 0.8, 0.15), 200); // E5
  },

  alert: () => {
    // Gentle warning (e.g., take a break)
    playTone(300, 'triangle', 0.4, 0.1);
    setTimeout(() => playTone(300, 'triangle', 0.4, 0.1), 200);
  }
};
