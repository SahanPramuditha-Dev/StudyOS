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
  const isProud = emotion === ORION_EMOTIONS.PROUD;
  const isThinking = emotion === ORION_EMOTIONS.THINKING;

  // Eye shape based on emotion
  const getEyelidRY = () => {
    if (isSleepy) return 10; // almost closed
    if (isBlinking) return 2;
    if (isProud) return 12; // squinting happily
    return 0;
  };
  const eyelidRY = getEyelidRY();

  const EyeUnit = ({ cx, isLeft }) => {
    // Determine pupil position based on emotion and cursor tracking
    let px = cx + pupilOffset.x * 4;
    let py = 52 + pupilOffset.y * 4;

    if (isThinking) {
      py = 46; // look up
      px = cx + (isLeft ? 4 : -4); // look inward slightly
    }

    const eyeColor = emotion === ORION_EMOTIONS.FOCUSED ? '#0ea5e9' :
                     emotion === ORION_EMOTIONS.WORRIED ? '#ef4444' : '#1e293b';

    return (
      <g>
        {/* Outer eye white */}
        <ellipse cx={cx} cy={52} rx={16} ry={16} fill="white" />
        
        {/* Pupil */}
        {!isSleepy && !isBlinking && (
          <motion.g
            animate={{ x: px - cx, y: py - 52 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <circle cx={cx} cy={52} r={8} fill={eyeColor} />
            <circle cx={cx + 2} cy={52 - 3} r={3} fill="white" opacity="0.8" />
            <circle cx={cx - 3} cy={52 + 2} r={1.5} fill="white" opacity="0.4" />
          </motion.g>
        )}
        
        {/* Sparkle stars for happy/celebrating */}
        {sparkle && (
          <motion.text x={cx - 4} y={48} textAnchor="middle" fontSize="9" fill="#fbbf24"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}>✦</motion.text>
        )}
        
        {/* Worried eyebrow */}
        {isWorried && (
          <path
            d={isLeft ? `M${cx-12},38 Q${cx},34 ${cx+12},38` : `M${cx-12},38 Q${cx},34 ${cx+12},38`}
            stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round"
            transform={isLeft ? `rotate(20,${cx},38)` : `rotate(-20,${cx},38)`}
          />
        )}
        
        {/* Eyelid overlay for blinking/sleeping/squinting */}
        {(isSleepy || isBlinking || isProud) && (
          <path 
            d={`M${cx-16},52 A16,16 0 0,1 ${cx+16},52 A16,${eyelidRY + (isBlinking ? 15 : 0)} 0 0,1 ${cx-16},52 Z`} 
            fill="#9a3412" 
          />
        )}
        
        {/* Sleep lines */}
        {isSleepy && (
          <>
            <line x1={cx - 10} y1={52} x2={cx + 10} y2={52} stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
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
  const glassColor = isGlowing ? '#38bdf8' : '#334155';
  const glowOpacity = isGlowing ? 0.6 : 0;
  
  // Animate glasses slightly up when thinking
  const yOffset = emotion === ORION_EMOTIONS.THINKING ? -2 : 0;

  return (
    <motion.g animate={{ y: yOffset }} transition={{ type: 'spring' }}>
      {/* Glow filter layer */}
      {isGlowing && (
        <>
          <ellipse cx={42} cy={52} rx={21} ry={21} fill="none" stroke="#7dd3fc" strokeWidth="6" opacity={glowOpacity} filter="url(#glow)" />
          <ellipse cx={78} cy={52} rx={21} ry={21} fill="none" stroke="#7dd3fc" strokeWidth="6" opacity={glowOpacity} filter="url(#glow)" />
        </>
      )}
      {/* Left lens frame */}
      <ellipse cx={42} cy={52} rx={19} ry={19} fill="none" stroke={glassColor} strokeWidth="3" />
      {/* Right lens frame */}
      <ellipse cx={78} cy={52} rx={19} ry={19} fill="none" stroke={glassColor} strokeWidth="3" />
      {/* Bridge */}
      <path d="M61,48 Q60,45 59,48" stroke={glassColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Left arm */}
      <path d="M23,48 Q15,45 10,42" stroke={glassColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M97,48 Q105,45 110,42" stroke={glassColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      
      {/* Glass reflections */}
      <path d="M28,40 Q35,36 42,36" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M64,40 Q71,36 78,36" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
    </motion.g>
  );
};

const GraduationCap = () => (
  <g transform="translate(0, -6)">
    {/* Cap base */}
    <path d="M42,22 L78,22 L74,32 L46,32 Z" fill="#1e293b" />
    {/* Cap top board */}
    <path d="M60,10 L30,18 L60,26 L90,18 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" strokeLinejoin="round" />
    {/* Tassel Button */}
    <circle cx={60} cy={18} r={3} fill="#fbbf24" />
    {/* Tassel String */}
    <path d="M60,18 Q75,18 82,24" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
    {/* Tassel Fringe */}
    <line x1={82} y1={24} x2={80} y2={32} stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1={82} y1={24} x2={82} y2={33} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    <line x1={82} y1={24} x2={84} y2={32} stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
  </g>
);

const OwlBody = ({ emotion }) => {
  const isCelebrating = emotion === ORION_EMOTIONS.CELEBRATING;
  const isHappy = emotion === ORION_EMOTIONS.HAPPY;
  const isWaving = emotion === ORION_EMOTIONS.WAVING;
  
  return (
    <g>
      {/* Ear Tufts (Horns) */}
      <path d="M28,30 Q20,10 32,20 Z" fill="#9a3412" />
      <path d="M92,30 Q100,10 88,20 Z" fill="#9a3412" />

      {/* Main Body (Egg Shape) */}
      <path d="M30,50 C30,10 90,10 90,50 C90,110 95,120 60,120 C25,120 30,110 30,50 Z" fill="url(#bodyGrad)" />
      
      {/* Face Mask (Heart Shape) */}
      <path d="M60,65 C40,40 20,40 25,65 C30,95 60,115 60,115 C60,115 90,95 95,65 C100,40 80,40 60,65 Z" fill="#fef08a" opacity="0.9" />
      <path d="M60,65 C40,40 20,40 25,65 C30,95 60,115 60,115 C60,115 90,95 95,65 C100,40 80,40 60,65 Z" fill="url(#faceGrad)" opacity="0.7" />

      {/* Chest Feathers (V-shapes) */}
      <g stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.3" fill="none">
        <path d="M50,85 Q60,95 70,85" />
        <path d="M55,95 Q60,102 65,95" />
        <path d="M45,90 Q50,97 55,90" />
        <path d="M65,90 Q70,97 75,90" />
      </g>

      {/* Wing Left */}
      <motion.g
        transformOrigin="35px 65px"
        animate={
          isCelebrating ? { rotate: [0, -30, 0, -30, 0] } :
          isHappy ? { rotate: [0, -10, 0] } :
          { rotate: [0, -2, 0] }
        }
        transition={
          isCelebrating ? { duration: 1.5, repeat: Infinity } :
          isHappy ? { duration: 2, repeat: Infinity, ease: "easeInOut" } :
          { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <path d="M32,65 C15,70 10,95 18,110 C25,95 28,80 35,75 Z" fill="url(#wingGrad)" />
      </motion.g>

      {/* Wing Right */}
      <motion.g
        transformOrigin="85px 65px"
        animate={
          isCelebrating ? { rotate: [0, 30, 0, 30, 0] } :
          isWaving ? { rotate: [0, -40, 20, -40, 0] } :
          isHappy ? { rotate: [0, 10, 0] } :
          { rotate: [0, 2, 0] }
        }
        transition={
          isCelebrating ? { duration: 1.5, repeat: Infinity, delay: 0.2 } :
          isWaving ? { duration: 1.5, repeat: 2 } :
          isHappy ? { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 } :
          { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
        }
      >
        <path d="M88,65 C105,70 110,95 102,110 C95,95 92,80 85,75 Z" fill="url(#wingGrad)" />
      </motion.g>

      {/* Beak */}
      <g transform="translate(0, 4)">
        <path d="M55,62 L60,72 L65,62 Z" fill="#f59e0b" />
        <path d="M55,62 L60,72 L65,62 Z" fill="url(#beakGrad)" opacity="0.8" />
        {/* Beak highlight */}
        <path d="M57,63 L60,69 L63,63" stroke="#fcd34d" strokeWidth="1" fill="none" />
      </g>

      {/* Feet */}
      <g stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Left Foot */}
        <path d="M42,120 L40,128 M42,120 L44,129 M42,120 L48,127" />
        {/* Right Foot */}
        <path d="M78,120 L80,128 M78,120 L76,129 M78,120 L72,127" />
      </g>
    </g>
  );
};

const OwlAccessories = ({ emotion }) => {
  const hasBook = emotion === ORION_EMOTIONS.FOCUSED || emotion === ORION_EMOTIONS.IDLE_READING;
  const hasCoffee = emotion === ORION_EMOTIONS.IDLE_COFFEE;
  const isCleaning = emotion === ORION_EMOTIONS.IDLE_CLEANING;

  return (
    <>
      
      {/* Book when focused */}
      <AnimatePresence>
        {hasBook && (
          <motion.g 
            initial={{ opacity: 0, y: 10, rotate: -10 }} 
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 10, rotate: 10 }}
          >
            <rect x={35} y={98} width={50} height={30} rx={4} fill="#1e3a8a" />
            <rect x={37} y={100} width={46} height={26} rx={2} fill="#f8fafc" />
            <line x1={60} y1={100} x2={60} y2={126} stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Text lines */}
            <line x1={40} y1={105} x2={55} y2={105} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={40} y1={110} x2={52} y2={110} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={40} y1={115} x2={55} y2={115} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={65} y1={105} x2={80} y2={105} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={65} y1={110} x2={78} y2={110} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>
      
      {/* Coffee when idle */}
      <AnimatePresence>
        {hasCoffee && (
          <motion.g
            transform="translate(80, 95)"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {/* Cup */}
            <rect x={0} y={10} width={20} height={18} rx={3} fill="#0ea5e9" />
            {/* Handle */}
            <path d="M20,14 Q26,14 26,19 Q26,24 20,24" stroke="#0284c7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Sleeve */}
            <rect x={0} y={16} width={20} height={6} fill="#78350f" />
            {/* Steam */}
            <motion.g animate={{ y: [0, -5, 0], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
              <path d="M6,6 Q4,2 8,-2" stroke="#d97706" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M12,8 Q10,4 14,0" stroke="#d97706" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Cleaning Cloth */}
      <AnimatePresence>
        {isCleaning && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.path 
              d="M75,55 Q85,45 95,55 Q100,65 90,75 Z" 
              fill="#fbcfe8"
              opacity="0.8"
              animate={{ x: [-10, 10, -10], y: [-5, 5, -5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── SVG Gradient Definitions ─────────────────────────────────────────────────

const SVGDefs = () => (
  <defs>
    <radialGradient id="bodyGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stopColor="#c2410c" />   {/* Orange/Brown bright */}
      <stop offset="60%" stopColor="#9a3412" />  {/* Mid brown */}
      <stop offset="100%" stopColor="#7c2d12" /> {/* Dark brown edges */}
    </radialGradient>
    <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="70%" stopColor="#fef3c7" />
      <stop offset="100%" stopColor="#fde68a" />
    </radialGradient>
    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#9a3412" />
      <stop offset="100%" stopColor="#78350f" />
    </linearGradient>
    <linearGradient id="beakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#fcd34d" />
      <stop offset="100%" stopColor="#d97706" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);

// ─── Main OrionCharacter ──────────────────────────────────────────────────────

const OrionCharacter = ({
  emotion = ORION_EMOTIONS.IDLE,
  animationTrigger,
  isThinking = false,
  xpGainDisplay,
  size = 140,
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
          // Double blink chance
          if (Math.random() > 0.7) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => {
                setIsBlinking(false);
                scheduleBlink();
              }, 100);
            }, 100);
          } else {
            scheduleBlink();
          }
        }, 120);
      }, delay);
    };
    const timer = scheduleBlink();
    return () => clearTimeout(timer);
  }, [emotion]);

  // ─── Mouse Eye Tracking ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || emotion === ORION_EMOTIONS.SLEEPY || isThinking) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.4;
    
    // Calculate distance and angle
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    
    // Normalize and constrain
    const distance = Math.min(1, Math.sqrt(dx*dx + dy*dy) / 500); // 500px is max influence range
    const angle = Math.atan2(dy, dx);
    
    setPupilOffset({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }, [emotion, isThinking]);

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
      y: [0, -6, 0],
      rotate: 0,
      scale: 1,
      transition: { y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } },
    },
    happy: {
      y: [0, -10, 0, -6, 0],
      rotate: [0, -3, 3, -2, 0],
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    celebrating: {
      y: [0, -25, -10, -20, 0],
      rotate: [0, -5, 5, -3, 0],
      scale: [1, 1.05, 1, 1.05, 1],
      transition: { duration: 1.5, repeat: Infinity },
    },
    thinking: {
      y: [0, -4, 0],
      rotate: [0, -4, 0],
      scale: 1,
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    focused: {
      y: [0, -3, 0],
      rotate: 0,
      scale: 1,
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    sleepy: {
      y: [0, 4, 0],
      rotate: [0, 2, 0],
      scale: [1, 0.98, 1],
      transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
    },
    worried: {
      y: 0,
      rotate: [-3, 3, -3],
      scale: 1,
      transition: { duration: 0.8, repeat: Infinity },
    },
    proud: {
      y: [0, -8, 0],
      rotate: 0,
      scale: [1, 1.05, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    confused: {
      y: 0,
      rotate: [0, -10, 0],
      scale: 1,
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 },
    },
    waving: {
      y: [0, -8, 0],
      rotate: [0, -5, 0],
      scale: 1,
      transition: { duration: 1.2, repeat: 3 },
    },
    idle_reading: {
      y: [0, -2, 0],
      rotate: 0,
      scale: 1,
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    idle_cleaning: {
      y: [0, -3, 0],
      rotate: [-2, 2, -2],
      scale: 1,
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
    idle_coffee: {
      y: [0, -1, 0],
      rotate: 0,
      scale: 1,
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    idle_looking: {
      y: [0, -4, 0],
      rotate: [-5, 5, -5],
      scale: 1,
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
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
          {[...Array(24)].map((_, i) => <ConfettiParticle key={i} index={i} />)}
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
        {(emotion === ORION_EMOTIONS.HAPPY || emotion === ORION_EMOTIONS.CELEBRATING || emotion === ORION_EMOTIONS.PROUD) && (
          <>
            <FloatingParticle key="s1" char="⭐" index={0} color="#fbbf24" />
            <FloatingParticle key="s2" char="✨" index={2} color="#f59e0b" />
          </>
        )}
      </AnimatePresence>

      {/* Thinking spinner overlay */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full"
            style={{ 
              border: '4px solid rgba(14, 165, 233, 0.2)', 
              borderTopColor: '#0ea5e9',
              boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Main Owl SVG */}
      <motion.div
        ref={svgRef}
        animate={currentVariant}
        style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.25)) drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
      >
        <svg
          width={size}
          height={size + 15}
          viewBox="0 0 120 145"
          xmlns="http://www.w3.org/2000/svg"
        >
          <SVGDefs />

          {/* Body */}
          <OwlBody emotion={emotion} />

          {/* Graduation cap */}
          <GraduationCap />

          {/* Eyes */}
          <OwlEyes pupilOffset={pupilOffset} isBlinking={isBlinking} emotion={emotion} />

          {/* Glasses */}
          <OwlGlasses emotion={emotion} />

          {/* Accessories */}
          <OwlAccessories emotion={emotion} />

          {/* AI Badge */}
          <g transform="translate(50, 105)">
            <rect x="0" y="0" width="20" height="12" rx="4" fill="#0f172a" opacity="0.8" />
            <text x="10" y="9" textAnchor="middle" fontSize="7" fill="#38bdf8" fontWeight="bold" letterSpacing="0.5">AI</text>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

export default OrionCharacter;
