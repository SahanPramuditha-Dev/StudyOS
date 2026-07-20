import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ORION_EMOTIONS } from '../../context/OrionContext';

// ─── Particle Effects ────────────────────────────────────────────────────────

const ConfettiParticle = ({ index }) => {
  const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f97316'];
  const color = colors[index % colors.length];
  const x = (Math.random() - 0.5) * 160;
  const y = -(Math.random() * 120 + 60);
  const rotate = Math.random() * 720;
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm pointer-events-none"
      style={{ backgroundColor: color, top: '40%', left: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ x, y, opacity: 0, scale: 0, rotate }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.04 }}
    />
  );
};

const FloatingParticle = ({ char, index, color = '#8b5cf6' }) => {
  const x = (Math.random() - 0.5) * 60;
  return (
    <motion.span
      className="absolute text-sm font-bold pointer-events-none select-none"
      style={{ color, top: '10%', left: `${40 + (index * 15)}%` }}
      initial={{ opacity: 0, y: 0, x: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: -50, x }}
      transition={{ duration: 2, delay: index * 0.3, repeat: Infinity, repeatDelay: 3 }}
    >
      {char}
    </motion.span>
  );
};

const ZZZParticle = ({ index }) => (
  <motion.span
    className="absolute text-slate-400 font-bold pointer-events-none select-none"
    style={{
      fontSize: `${10 + index * 3}px`,
      right: index * 14,
      top: -(index * 12),
    }}
    initial={{ opacity: 0, y: 0, x: 0 }}
    animate={{ opacity: [0, 1, 1, 0], y: -30, x: index * 5 }}
    transition={{ duration: 2.5, delay: index * 0.6, repeat: Infinity, repeatDelay: 1 }}
  >
    Z
  </motion.span>
);

const XPPopup = ({ amount, label }) => (
  <motion.div
    className="absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none z-20"
    initial={{ opacity: 0, y: 10, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
  >
    <div className="bg-amber-400 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
      +{amount} XP · {label}
    </div>
  </motion.div>
);

// ─── Owl SVG Parts ────────────────────────────────────────────────────────────

const OwlEyes = ({ pupilOffset, isBlinking, emotion }) => {
  const sparkle = emotion === ORION_EMOTIONS.CELEBRATING || emotion === ORION_EMOTIONS.HAPPY;
  const isSleepy = emotion === ORION_EMOTIONS.SLEEPY;
  const isWorried = emotion === ORION_EMOTIONS.WORRIED;

  // Eye shape based on emotion
  const getEyelidRY = () => {
    if (isSleepy) return 7; // almost closed
    if (isBlinking) return 1;
    return 0;
  };
  const eyelidRY = getEyelidRY();

  const EyeUnit = ({ cx, isLeft }) => {
    const px = cx + pupilOffset.x * 3.5;
    const py = 48 + pupilOffset.y * 3.5;
    const eyeColor = emotion === ORION_EMOTIONS.FOCUSED ? '#7dd3fc' :
                     emotion === ORION_EMOTIONS.WORRIED ? '#fca5a5' : '#1e293b';

    return (
      <g>
        {/* Eye socket glow */}
        <ellipse cx={cx} cy={48} rx={14} ry={14} fill="white" opacity="0.95" />
        <ellipse cx={cx} cy={48} rx={14} ry={14} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
        {/* Pupil */}
        {!isSleepy && !isBlinking && (
          <>
            <circle cx={px} cy={py} r={6.5} fill={eyeColor} />
            <circle cx={px + 2} cy={py - 2} r={2.5} fill="white" opacity="0.6" />
            <circle cx={px - 2} cy={py + 1.5} r={1} fill="white" opacity="0.3" />
          </>
        )}
        {/* Sparkle stars for happy/celebrating */}
        {sparkle && (
          <>
            <motion.text x={cx - 3} y={44} textAnchor="middle" fontSize="7" fill="#fbbf24"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}>✦</motion.text>
          </>
        )}
        {/* Worried eyebrow */}
        {isWorried && (
          <path
            d={isLeft ? `M${cx-10},36 Q${cx},32 ${cx+10},36` : `M${cx-10},36 Q${cx},32 ${cx+10},36`}
            stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round"
            transform={isLeft ? `rotate(15,${cx},36)` : `rotate(-15,${cx},36)`}
          />
        )}
        {/* Eyelid overlay for blinking/sleeping */}
        {(isSleepy || isBlinking) && (
          <ellipse cx={cx} cy={48} rx={14} ry={eyelidRY + (isBlinking ? 13 : 0)} fill="#c2956c" />
        )}
        {/* Sleep lines */}
        {isSleepy && (
          <>
            <line x1={cx - 8} y1={48} x2={cx + 8} y2={48} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1={cx - 5} y1={52} x2={cx + 5} y2={52} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </g>
    );
  };

  return (
    <>
      <EyeUnit cx={42} isLeft />
      <EyeUnit cx={78} isLeft={false} />
    </>
  );
};

const OwlGlasses = ({ emotion }) => {
  const isGlowing = emotion === ORION_EMOTIONS.FOCUSED || emotion === ORION_EMOTIONS.THINKING;
  const glassColor = isGlowing ? '#7dd3fc' : '#475569';
  const glowOpacity = isGlowing ? 0.4 : 0;

  return (
    <g>
      {/* Glow filter layer */}
      {isGlowing && (
        <>
          <ellipse cx={42} cy={48} rx={17} ry={17} fill="none" stroke="#38bdf8" strokeWidth="4" opacity={glowOpacity} />
          <ellipse cx={78} cy={48} rx={17} ry={17} fill="none" stroke="#38bdf8" strokeWidth="4" opacity={glowOpacity} />
        </>
      )}
      {/* Left lens frame */}
      <ellipse cx={42} cy={48} rx={15} ry={15} fill="none" stroke={glassColor} strokeWidth="2.5" />
      {/* Right lens frame */}
      <ellipse cx={78} cy={48} rx={15} ry={15} fill="none" stroke={glassColor} strokeWidth="2.5" />
      {/* Bridge */}
      <path d="M57,47 Q60,44 63,47" stroke={glassColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Left arm */}
      <path d="M27,44 Q22,42 18,40" stroke={glassColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M93,44 Q98,42 102,40" stroke={glassColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
};

const GraduationCap = () => (
  <g>
    {/* Cap base */}
    <ellipse cx={60} cy={20} rx={22} ry={6} fill="#1e293b" />
    {/* Cap top board */}
    <rect x={38} y={8} width={44} height={10} rx={3} fill="#0f172a" />
    {/* Tassel */}
    <circle cx={82} cy={8} r={3} fill="#fbbf24" />
    <line x1={82} y1={11} x2={82} y2={22} stroke="#fbbf24" strokeWidth="1.5" />
    <line x1={79} y1={22} x2={85} y2={22} stroke="#fbbf24" strokeWidth="1.5" />
    {/* Shine on cap */}
    <ellipse cx={52} cy={11} rx={8} ry={3} fill="white" opacity="0.08" transform="rotate(-15 52 11)" />
  </g>
);

const OwlBody = ({ emotion }) => {
  const isCelebrating = emotion === ORION_EMOTIONS.CELEBRATING;
  return (
    <g>
      {/* Main body */}
      <ellipse cx={60} cy={80} rx={38} ry={45} fill="url(#bodyGrad)" />
      {/* Chest feather pattern */}
      <ellipse cx={60} cy={88} rx={22} ry={28} fill="url(#chestGrad)" />
      {/* Wing left */}
      <motion.path
        d="M22,70 Q8,80 12,100 Q22,95 30,80 Z"
        fill="url(#wingGrad)"
        animate={isCelebrating
          ? { rotate: [0, -20, 10, -15, 5, 0], originX: '30px', originY: '80px' }
          : { rotate: [0, -3, 0, -3, 0], originX: '30px', originY: '80px' }}
        transition={isCelebrating
          ? { duration: 1.5, repeat: 2 }
          : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Wing right */}
      <motion.path
        d="M98,70 Q112,80 108,100 Q98,95 90,80 Z"
        fill="url(#wingGrad)"
        animate={isCelebrating
          ? { rotate: [0, 20, -10, 15, -5, 0], originX: '90px', originY: '80px' }
          : { rotate: [0, 3, 0, 3, 0], originX: '90px', originY: '80px' }}
        transition={isCelebrating
          ? { duration: 1.5, repeat: 2 }
          : { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      {/* Feather detail lines */}
      <path d="M38,95 Q60,88 82,95" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.3" />
      <path d="M40,105 Q60,98 80,105" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.3" />
      {/* Beak */}
      <path d="M55,62 L60,70 L65,62 Q60,58 55,62 Z" fill="#fbbf24" />
      <path d="M55,62 L60,66 L65,62" stroke="#d97706" strokeWidth="0.5" fill="none" />
      {/* Feet */}
      <g opacity="0.9">
        <path d="M45,120 Q42,128 38,130 M45,120 Q45,128 45,130 M45,120 Q48,128 52,130" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M75,120 Q72,128 68,130 M75,120 Q75,128 75,130 M75,120 Q78,128 82,130" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

const OwlAccessories = ({ emotion }) => {
  const hasBook = emotion === ORION_EMOTIONS.FOCUSED;
  const hasCoffee = emotion === ORION_EMOTIONS.IDLE;

  return (
    <>
      {/* Feather pen (always visible) */}
      <g transform="rotate(-25 95 95) translate(88, 85)">
        <path d="M0,0 Q5,-20 2,-35 Q-2,-35 0,-20 Q-4,-10 0,0 Z" fill="#a855f7" opacity="0.8" />
        <path d="M0,0 L2,-10" stroke="#7c3aed" strokeWidth="1" fill="none" />
        <path d="M2,-35 Q6,-42 4,-50" stroke="#c4b5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Book when focused */}
      {hasBook && (
        <motion.g initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
          <rect x={35} y={108} width={50} height={28} rx={3} fill="#3b82f6" />
          <rect x={35} y={108} width={25} height={28} rx={3} fill="#2563eb" />
          <line x1={60} y1={108} x2={60} y2={136} stroke="#1d4ed8" strokeWidth="1" />
          <rect x={38} y={112} width={18} height={2} rx={1} fill="white" opacity="0.5" />
          <rect x={38} y={117} width={14} height={2} rx={1} fill="white" opacity="0.4" />
          <rect x={38} y={122} width={16} height={2} rx={1} fill="white" opacity="0.3" />
        </motion.g>
      )}
      {/* Coffee when idle */}
      {hasCoffee && (
        <motion.g
          transform="translate(82, 100)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <rect x={0} y={8} width={18} height={14} rx={3} fill="#f59e0b" />
          <path d="M18,12 Q24,12 24,16 Q24,20 18,20" stroke="#d97706" strokeWidth="2" fill="none" />
          <rect x={2} y={4} width={14} height={6} rx={2} fill="#78350f" />
          <path d="M6,4 Q5,0 7,-2" stroke="#d97706" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M10,4 Q9,0 11,-3" stroke="#d97706" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        </motion.g>
      )}
    </>
  );
};

// ─── SVG Gradient Definitions ─────────────────────────────────────────────────

const SVGDefs = () => (
  <defs>
    <radialGradient id="bodyGrad" cx="45%" cy="35%" r="65%">
      <stop offset="0%" stopColor="#d97706" />
      <stop offset="40%" stopColor="#b45309" />
      <stop offset="100%" stopColor="#78350f" />
    </radialGradient>
    <radialGradient id="chestGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stopColor="#fef3c7" />
      <stop offset="60%" stopColor="#fde68a" />
      <stop offset="100%" stopColor="#fbbf24" />
    </radialGradient>
    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#92400e" />
      <stop offset="100%" stopColor="#78350f" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.15" />
    </filter>
  </defs>
);

// ─── Main OrionCharacter ──────────────────────────────────────────────────────

const OrionCharacter = ({
  emotion = ORION_EMOTIONS.IDLE,
  animationTrigger,
  isThinking = false,
  xpGainDisplay,
  size = 130,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const svgRef = useRef(null);

  // ─── Blink Loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (emotion === ORION_EMOTIONS.SLEEPY) return;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 4000;
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 120);
      }, delay);
    };
    const timer = scheduleBlink();
    return () => clearTimeout(timer);
  }, [emotion]);

  // ─── Mouse Eye Tracking ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.38;
    const dx = (e.clientX - cx) / window.innerWidth;
    const dy = (e.clientY - cy) / window.innerHeight;
    setPupilOffset({
      x: Math.max(-1, Math.min(1, dx * 4)),
      y: Math.max(-1, Math.min(1, dy * 4)),
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // ─── Confetti Trigger ─────────────────────────────────────────────────────
  useEffect(() => {
    if (animationTrigger === 'levelUp' || emotion === ORION_EMOTIONS.CELEBRATING) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
  }, [animationTrigger, emotion]);

  // ─── Body Motion Variants ─────────────────────────────────────────────────
  const bodyVariants = {
    idle: {
      y: [0, -5, 0],
      rotate: 0,
      transition: { y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
    },
    happy: {
      y: [0, -8, 0, -5, 0],
      rotate: [0, -2, 2, -2, 0],
      transition: { duration: 1.5, repeat: 2 },
    },
    celebrating: {
      y: [0, -20, -10, -18, 0],
      rotate: [0, -5, 5, -3, 0],
      scale: [1, 1.05, 1, 1.05, 1],
      transition: { duration: 1.2, repeat: 2 },
    },
    thinking: {
      y: [0, -3, 0],
      rotate: [0, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    focused: {
      y: [0, -2, 0],
      rotate: 0,
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    sleepy: {
      y: [0, 2, 0],
      rotate: [0, 3, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    worried: {
      y: 0,
      rotate: [-2, 2, -2],
      transition: { duration: 0.8, repeat: Infinity },
    },
    proud: {
      y: [0, -6, 0],
      rotate: 0,
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    confused: {
      y: 0,
      rotate: [0, -8, 0],
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 },
    },
    waving: {
      y: [0, -5, 0],
      rotate: [0, -3, 0],
      transition: { duration: 1, repeat: 3 },
    },
  };

  const currentVariant = bodyVariants[emotion] || bodyVariants.idle;

  return (
    <div className="relative select-none" style={{ width: size, height: size + 20 }}>
      {/* XP Popup */}
      <AnimatePresence>
        {xpGainDisplay && (
          <XPPopup key="xp" amount={xpGainDisplay.amount} label={xpGainDisplay.label} />
        )}
      </AnimatePresence>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(18)].map((_, i) => <ConfettiParticle key={i} index={i} />)}
        </div>
      )}

      {/* Floating particles by emotion */}
      <AnimatePresence>
        {emotion === ORION_EMOTIONS.THINKING && (
          <>
            <FloatingParticle key="q1" char="?" index={0} color="#8b5cf6" />
            <FloatingParticle key="q2" char="?" index={1} color="#a78bfa" />
          </>
        )}
        {emotion === ORION_EMOTIONS.CONFUSED && (
          <>
            <FloatingParticle key="c1" char="?" index={0} color="#f59e0b" />
            <FloatingParticle key="c2" char="?" index={2} color="#fbbf24" />
          </>
        )}
        {emotion === ORION_EMOTIONS.SLEEPY && (
          <div className="absolute" style={{ top: 0, right: 0 }}>
            <ZZZParticle index={0} />
            <ZZZParticle index={1} />
            <ZZZParticle index={2} />
          </div>
        )}
        {(emotion === ORION_EMOTIONS.HAPPY || emotion === ORION_EMOTIONS.CELEBRATING) && (
          <>
            <FloatingParticle key="s1" char="⭐" index={0} color="#fbbf24" />
            <FloatingParticle key="s2" char="✨" index={2} color="#f59e0b" />
          </>
        )}
      </AnimatePresence>

      {/* Thinking spinner overlay */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full"
            style={{ borderWidth: 3, borderColor: '#7dd3fc', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Main Owl SVG */}
      <motion.div
        ref={svgRef}
        animate={currentVariant}
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
      >
        <svg
          width={size}
          height={size + 10}
          viewBox="0 0 120 145"
          xmlns="http://www.w3.org/2000/svg"
        >
          <SVGDefs />

          {/* Head base */}
          <ellipse cx={60} cy={52} rx={40} ry={40} fill="url(#bodyGrad)" />

          {/* Ear tufts */}
          <path d="M28,22 Q22,5 32,12 Q36,18 38,24 Z" fill="#92400e" />
          <path d="M92,22 Q98,5 88,12 Q84,18 82,24 Z" fill="#92400e" />

          {/* Graduation cap */}
          <GraduationCap />

          {/* Face circle (lighter area) */}
          <ellipse cx={60} cy={52} rx={30} ry={28} fill="#fef3c7" opacity="0.6" />

          {/* Eyes */}
          <OwlEyes pupilOffset={pupilOffset} isBlinking={isBlinking} emotion={emotion} />

          {/* Glasses */}
          <OwlGlasses emotion={emotion} />

          {/* Body */}
          <OwlBody emotion={emotion} />

          {/* Accessories */}
          <OwlAccessories emotion={emotion} />

          {/* AI symbol (tiny badge on chest) */}
          <g transform="translate(50, 78)">
            <circle cx={10} cy={10} r={8} fill="#1e293b" opacity="0.85" />
            <text x={10} y={14} textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="bold">AI</text>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

export default OrionCharacter;
