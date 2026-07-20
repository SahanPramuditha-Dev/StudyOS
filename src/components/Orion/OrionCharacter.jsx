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

// ─── SVG Gradient & Filter Definitions ───────────────────────────────────────

const SVGDefs = () => (
  <defs>
    {/* ── Body gradients ── */}
    <radialGradient id="bodyGrad" cx="40%" cy="30%" r="70%">
      <stop offset="0%"   stopColor="#dc6b2c" />   {/* warm highlight */}
      <stop offset="45%"  stopColor="#9a3412" />    {/* mid-brown */}
      <stop offset="100%" stopColor="#5c1d07" />    {/* deep shadow edge */}
    </radialGradient>

    {/* Inner shadow on body (dark bottom rim) */}
    <radialGradient id="bodyShadow" cx="50%" cy="90%" r="60%">
      <stop offset="0%"  stopColor="#3b0f00" stopOpacity="0.6" />
      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
    </radialGradient>

    {/* Specular highlight on top of body */}
    <radialGradient id="bodyHighlight" cx="38%" cy="18%" r="35%">
      <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.25" />
      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
    </radialGradient>

    {/* ── Face gradients ── */}
    <radialGradient id="faceGrad" cx="45%" cy="35%" r="60%">
      <stop offset="0%"   stopColor="#fff9e6" />
      <stop offset="60%"  stopColor="#fef3c7" />
      <stop offset="100%" stopColor="#fcd34d" />
    </radialGradient>

    {/* Face depth shadow at edges */}
    <radialGradient id="faceShadow" cx="50%" cy="100%" r="55%">
      <stop offset="0%"  stopColor="#b45309" stopOpacity="0.3" />
      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
    </radialGradient>

    {/* ── Wing gradients ── */}
    <linearGradient id="wingGradL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stopColor="#c2410c" />
      <stop offset="50%"  stopColor="#9a3412" />
      <stop offset="100%" stopColor="#5c1d07" />
    </linearGradient>

    <linearGradient id="wingGradR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stopColor="#c2410c" />
      <stop offset="50%"  stopColor="#9a3412" />
      <stop offset="100%" stopColor="#5c1d07" />
    </linearGradient>

    {/* ── Beak gradient ── */}
    <linearGradient id="beakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stopColor="#fde047" />
      <stop offset="40%"  stopColor="#f59e0b" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>

    {/* ── Glasses gradient (shiny plastic look) ── */}
    <linearGradient id="glassFrameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stopColor="#64748b" />
      <stop offset="40%"  stopColor="#334155" />
      <stop offset="100%" stopColor="#1e293b" />
    </linearGradient>

    <linearGradient id="glassFrameGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stopColor="#7dd3fc" />
      <stop offset="100%" stopColor="#0ea5e9" />
    </linearGradient>

    {/* Tinted glass lens fill */}
    <radialGradient id="lensGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%"  stopColor="#bae6fd" stopOpacity="0.15" />
      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.08" />
    </radialGradient>

    {/* ── Cap gradient ── */}
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stopColor="#334155" />
      <stop offset="100%" stopColor="#0f172a" />
    </linearGradient>

    {/* ── Feet gradient ── */}
    <linearGradient id="feetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stopColor="#f97316" />
      <stop offset="100%" stopColor="#c2410c" />
    </linearGradient>

    {/* ── Eye gradient (iris depth) ── */}
    <radialGradient id="irisGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%"   stopColor="#4b5563" />
      <stop offset="70%"  stopColor="#1e293b" />
      <stop offset="100%" stopColor="#020617" />
    </radialGradient>

    <radialGradient id="irisGradBlue" cx="35%" cy="30%" r="65%">
      <stop offset="0%"   stopColor="#38bdf8" />
      <stop offset="70%"  stopColor="#0369a1" />
      <stop offset="100%" stopColor="#082f49" />
    </radialGradient>

    <radialGradient id="irisGradRed" cx="35%" cy="30%" r="65%">
      <stop offset="0%"   stopColor="#f87171" />
      <stop offset="70%"  stopColor="#b91c1c" />
      <stop offset="100%" stopColor="#450a0a" />
    </radialGradient>

    {/* ── Glow filter ── */}
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    {/* Soft shadow filter for depth elements */}
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
    </filter>
  </defs>
);

// ─── Owl Eyes ────────────────────────────────────────────────────────────────

const OwlEyes = ({ pupilOffset, isBlinking, emotion }) => {
  const sparkle  = emotion === ORION_EMOTIONS.CELEBRATING || emotion === ORION_EMOTIONS.HAPPY;
  const isSleepy = emotion === ORION_EMOTIONS.SLEEPY;
  const isProud  = emotion === ORION_EMOTIONS.PROUD;
  const isThinking = emotion === ORION_EMOTIONS.THINKING;
  const isWorried  = emotion === ORION_EMOTIONS.WORRIED;

  const irisGradId = emotion === ORION_EMOTIONS.FOCUSED ? 'url(#irisGradBlue)'
                   : emotion === ORION_EMOTIONS.WORRIED  ? 'url(#irisGradRed)'
                   : 'url(#irisGrad)';

  const EyeUnit = ({ cx, isLeft }) => {
    let px = cx + pupilOffset.x * 4.5;
    let py = 52 + pupilOffset.y * 4.5;

    if (isThinking) { py = 46; px = cx + (isLeft ? 3 : -3); }

    // Eyelid closes DOWN from the top (more natural)
    const lidClose = isSleepy ? 0.92 : isBlinking ? 0.98 : isProud ? 0.55 : 0;

    return (
      <g>
        {/* Sclera (white of eye) with subtle inner shadow */}
        <ellipse cx={cx} cy={52} rx={16} ry={16} fill="white" />
        {/* Inner shadow rim to give depth */}
        <ellipse cx={cx} cy={52} rx={16} ry={16} fill="none" stroke="#d1d5db" strokeWidth="1.5" opacity="0.4" />
        {/* Bottom shadow inside eye */}
        <ellipse cx={cx} cy={58} rx={12} ry={8} fill="#94a3b8" opacity="0.1" />

        {/* Iris + Pupil */}
        {!isSleepy && !isBlinking && (
          <motion.g
            animate={{ x: px - cx, y: py - 52 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          >
            {/* Iris */}
            <circle cx={cx} cy={52} r={9} fill={irisGradId} />
            {/* Pupil */}
            <circle cx={cx} cy={52} r={5.5} fill="#000" opacity="0.85" />
            {/* Primary highlight */}
            <circle cx={cx + 2.5} cy={52 - 3.5} r={3} fill="white" opacity="0.85" />
            {/* Secondary small highlight */}
            <circle cx={cx - 3} cy={52 + 3} r={1.5} fill="white" opacity="0.4" />
          </motion.g>
        )}

        {/* Sparkle for happy/celebrating */}
        {sparkle && (
          <motion.text
            x={cx} y={48} textAnchor="middle" fontSize="9" fill="#fbbf24"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >✦</motion.text>
        )}

        {/* Expressive eyebrow */}
        <motion.path
          d={isLeft
            ? `M${cx-10},37 Q${cx},32 ${cx+10},37`
            : `M${cx-10},37 Q${cx},32 ${cx+10},37`
          }
          stroke="#4a2006"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          animate={
            isWorried  ? { d: isLeft ? `M${cx-10},34 Q${cx},38 ${cx+10},34` : `M${cx-10},34 Q${cx},38 ${cx+10},34` } :
            sparkle    ? { d: isLeft ? `M${cx-10},33 Q${cx},29 ${cx+10},33` : `M${cx-10},33 Q${cx},29 ${cx+10},33` } :
            isThinking ? { d: isLeft ? `M${cx-10},36 Q${cx},33 ${cx+10},35` : `M${cx-10},35 Q${cx},33 ${cx+10},36` } :
            {}
          }
          transition={{ duration: 0.4 }}
        />

        {/* Eyelid — closes from top DOWN, natural brown feather color */}
        {(isSleepy || isBlinking || isProud) && (
          <motion.rect
            x={cx - 17}
            y={36}
            width={34}
            rx={4}
            fill="#8b3b0a"
            animate={{ height: 16 + 16 * lidClose }}
            transition={{ duration: isSleepy ? 0.8 : 0.12, ease: 'easeInOut' }}
          />
        )}

        {/* Sleep horizontal line across closed eye */}
        {isSleepy && (
          <line x1={cx - 9} y1={52} x2={cx + 9} y2={52}
            stroke="#5c1d07" strokeWidth="2.5" strokeLinecap="round" />
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

// ─── Premium Glasses ─────────────────────────────────────────────────────────

const OwlGlasses = ({ emotion }) => {
  const isGlowing = emotion === ORION_EMOTIONS.FOCUSED || emotion === ORION_EMOTIONS.THINKING;
  const frameGrad = isGlowing ? 'url(#glassFrameGlow)' : 'url(#glassFrameGrad)';
  const yOff = emotion === ORION_EMOTIONS.THINKING ? -2 : 0;

  return (
    <motion.g animate={{ y: yOff }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      {/* Glow aura when active */}
      {isGlowing && (
        <>
          <ellipse cx={42} cy={52} rx={21} ry={21} fill="none" stroke="#7dd3fc" strokeWidth="7" opacity="0.45" filter="url(#glow)" />
          <ellipse cx={78} cy={52} rx={21} ry={21} fill="none" stroke="#7dd3fc" strokeWidth="7" opacity="0.45" filter="url(#glow)" />
        </>
      )}

      {/* Tinted glass fill (subtle blue tint) */}
      <ellipse cx={42} cy={52} rx={18} ry={18} fill="url(#lensGrad)" />
      <ellipse cx={78} cy={52} rx={18} ry={18} fill="url(#lensGrad)" />

      {/* Frame rings — thick & premium */}
      <ellipse cx={42} cy={52} rx={18} ry={18} fill="none" stroke={frameGrad} strokeWidth="4" />
      <ellipse cx={78} cy={52} rx={18} ry={18} fill="none" stroke={frameGrad} strokeWidth="4" />

      {/* Frame inner highlight (top arc — shiny plastic) */}
      <path d="M26,44 Q42,32 58,44" fill="none" stroke="white" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <path d="M62,44 Q78,32 94,44" fill="none" stroke="white" strokeWidth="2" opacity="0.2" strokeLinecap="round" />

      {/* Bridge */}
      <path d="M60,50 Q60,46 60,50" stroke={frameGrad} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M61,49 Q60,45 59,49" stroke={frameGrad} strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Temple arms */}
      <path d="M24,48 Q15,46 8,42" stroke={frameGrad} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M96,48 Q105,46 112,42" stroke={frameGrad} strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Lens reflection streak — gives glassy feel */}
      <path d="M30,41 Q37,36 44,40" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M66,41 Q73,36 80,40" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
    </motion.g>
  );
};

// ─── Premium Graduation Cap ───────────────────────────────────────────────────

const GraduationCap = () => (
  <g transform="translate(0, -6)">
    {/* Cap body/stem (the part sitting on head) */}
    <path d="M44,24 L76,24 L73,34 L47,34 Z" fill="url(#capGrad)" />
    {/* 3D bevel top of stem — lighter face */}
    <path d="M44,24 L76,24 L73,27 L47,27 Z" fill="#475569" />

    {/* Mortarboard flat top — with 3D perspective */}
    <path d="M60,9 L28,19 L60,27 L92,19 Z" fill="url(#capGrad)" />
    {/* Top board top-face highlight */}
    <path d="M60,9 L28,19 L60,14 Z" fill="#475569" opacity="0.6" />
    {/* Top board bottom-face shadow */}
    <path d="M60,27 L28,19 L60,22 Z" fill="#020617" opacity="0.4" />

    {/* Border of board */}
    <path d="M60,9 L28,19 L60,27 L92,19 Z" fill="none" stroke="#334155" strokeWidth="1" strokeLinejoin="round" />

    {/* Center button */}
    <circle cx={60} cy={18} r={3.5} fill="#fbbf24" />
    <circle cx={60} cy={17} r={1.5} fill="#fde68a" opacity="0.7" />

    {/* Tassel string — thicker, natural curve */}
    <path d="M60,18 Q74,20 82,27" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />

    {/* Tassel fringe — thicker strands */}
    <path d="M82,27 Q80,35 78,40" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M82,27 Q82,36 82,41" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M82,27 Q84,35 86,39" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Tassel knot */}
    <ellipse cx={82} cy={29} rx={4} ry={3} fill="#d97706" />
  </g>
);

// ─── Owl Body ────────────────────────────────────────────────────────────────

const OwlBody = ({ emotion }) => {
  const isCelebrating = emotion === ORION_EMOTIONS.CELEBRATING;
  const isHappy       = emotion === ORION_EMOTIONS.HAPPY;
  const isWaving      = emotion === ORION_EMOTIONS.WAVING;

  return (
    <g>
      {/* ─ Ear Tufts ─ */}
      <path d="M30,32 Q22,10 34,22 Z" fill="#7c2d12" />
      <path d="M34,22 Q28,12 36,16 Z" fill="#9a3412" />
      <path d="M90,32 Q98,10 86,22 Z" fill="#7c2d12" />
      <path d="M86,22 Q92,12 84,16 Z" fill="#9a3412" />

      {/* ─ Main body shadow (cast below) ─ */}
      <ellipse cx={60} cy={128} rx={28} ry={5} fill="#000" opacity="0.15" />

      {/* ─ Main body shape ─ */}
      <path d="M30,52 C30,12 90,12 90,52 C90,112 94,122 60,122 C26,122 30,112 30,52 Z" fill="url(#bodyGrad)" />

      {/* Body specular highlight (top-left sphere sheen) */}
      <path d="M30,52 C30,12 90,12 90,52 C90,112 94,122 60,122 C26,122 30,112 30,52 Z" fill="url(#bodyHighlight)" />

      {/* Body bottom shadow */}
      <path d="M30,52 C30,12 90,12 90,52 C90,112 94,122 60,122 C26,122 30,112 30,52 Z" fill="url(#bodyShadow)" />

      {/* ─ Face mask (heart / rounded shape) ─ */}
      <path
        d="M60,66 C42,42 20,42 25,67 C30,96 60,117 60,117 C60,117 90,96 95,67 C100,42 78,42 60,66 Z"
        fill="url(#faceGrad)"
      />
      {/* Face inner shadow */}
      <path
        d="M60,66 C42,42 20,42 25,67 C30,96 60,117 60,117 C60,117 90,96 95,67 C100,42 78,42 60,66 Z"
        fill="url(#faceShadow)"
      />

      {/* ─ Chest feather details ─ */}
      <g stroke="#b45309" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35">
        <path d="M48,86 Q60,97 72,86" />
        <path d="M53,96 Q60,104 67,96" />
        <path d="M43,92 Q49,100 55,92" />
        <path d="M65,92 Q71,100 77,92" />
      </g>

      {/* ─ Left Wing ─ */}
      <motion.g
        transformOrigin="32px 68px"
        animate={
          isCelebrating ? { rotate: [0, -32, 0, -32, 0] } :
          isHappy       ? { rotate: [0, -12, 0] } :
          { rotate: [0, -3, 0] }
        }
        transition={
          isCelebrating ? { duration: 1.4, repeat: Infinity } :
          isHappy       ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } :
          { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Wing base */}
        <path d="M32,68 C14,74 8,100 18,114 C26,96 30,82 36,76 Z" fill="url(#wingGradL)" />
        {/* Wing highlight */}
        <path d="M32,68 C20,74 14,88 18,100" fill="none" stroke="#c2410c" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        {/* Wing feather tips */}
        <path d="M18,114 Q14,118 16,112" fill="#7c2d12" opacity="0.6" />
      </motion.g>

      {/* ─ Right Wing ─ */}
      <motion.g
        transformOrigin="88px 68px"
        animate={
          isCelebrating ? { rotate: [0, 32, 0, 32, 0] } :
          isWaving      ? { rotate: [0, -45, 20, -45, 0] } :
          isHappy       ? { rotate: [0, 12, 0] } :
          { rotate: [0, 3, 0] }
        }
        transition={
          isCelebrating ? { duration: 1.4, repeat: Infinity, delay: 0.15 } :
          isWaving      ? { duration: 1.5, repeat: 2 } :
          isHappy       ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } :
          { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }
        }
      >
        <path d="M88,68 C106,74 112,100 102,114 C94,96 90,82 84,76 Z" fill="url(#wingGradR)" />
        <path d="M88,68 C100,74 106,88 102,100" fill="none" stroke="#c2410c" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        <path d="M102,114 Q106,118 104,112" fill="#7c2d12" opacity="0.6" />
      </motion.g>

      {/* ─ Beak (3D curved) ─ */}
      <g transform="translate(0, 5)">
        {/* Beak shadow */}
        <path d="M57,62 L60,73 L63,62 Z" fill="#92400e" />
        {/* Beak main */}
        <path d="M56,61 L60,71 L64,61 Q62,58 60,58 Q58,58 56,61 Z" fill="url(#beakGrad)" />
        {/* Beak top highlight */}
        <path d="M58,61 Q60,59 62,61" stroke="#fde68a" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* Beak crease */}
        <path d="M58,63 L60,70 L62,63" stroke="#b45309" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />
      </g>

      {/* ─ Pudgy Feet (filled shapes, not lines) ─ */}
      <g fill="url(#feetGrad)">
        {/* Left Ankle */}
        <path d="M45,122 Q43,128 40,129 Q38,130 39,128 Q37,130 36,128 Q40,126 43,122 Z" />
        {/* Left Toes */}
        <ellipse cx={39} cy={129} rx={3.5} ry={2.5} fill="#ea580c" />
        <ellipse cx={43} cy={130} rx={3.5} ry={2.5} fill="#f97316" />
        <ellipse cx={47} cy={129} rx={3.5} ry={2.5} fill="#ea580c" />

        {/* Right Ankle */}
        <path d="M75,122 Q77,128 80,129 Q82,130 81,128 Q83,130 84,128 Q80,126 77,122 Z" />
        {/* Right Toes */}
        <ellipse cx={81} cy={129} rx={3.5} ry={2.5} fill="#ea580c" />
        <ellipse cx={77} cy={130} rx={3.5} ry={2.5} fill="#f97316" />
        <ellipse cx={73} cy={129} rx={3.5} ry={2.5} fill="#ea580c" />
      </g>
    </g>
  );
};

// ─── Accessories ─────────────────────────────────────────────────────────────

const OwlAccessories = ({ emotion }) => {
  const hasBook   = emotion === ORION_EMOTIONS.FOCUSED || emotion === ORION_EMOTIONS.IDLE_READING;
  const hasCoffee = emotion === ORION_EMOTIONS.IDLE_COFFEE;
  const isCleaning = emotion === ORION_EMOTIONS.IDLE_CLEANING;

  return (
    <>
      {/* Book */}
      <AnimatePresence>
        {hasBook && (
          <motion.g
            initial={{ opacity: 0, y: 10, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 10, rotate: 10 }}
          >
            {/* Book shadow */}
            <rect x={34} y={102} width={52} height={30} rx={4} fill="#000" opacity="0.15" />
            {/* Book cover */}
            <rect x={34} y={98} width={52} height={30} rx={4} fill="#1e3a8a" />
            {/* Cover highlight */}
            <rect x={35} y={99} width={50} height={6} rx={3} fill="#3b5bdb" opacity="0.5" />
            {/* Pages */}
            <rect x={37} y={100} width={46} height={26} rx={2} fill="#f8fafc" />
            {/* Spine */}
            <line x1={60} y1={100} x2={60} y2={126} stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Text lines left page */}
            <line x1={40} y1={106} x2={55} y2={106} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={40} y1={111} x2={52} y2={111} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={40} y1={116} x2={55} y2={116} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            {/* Text lines right page */}
            <line x1={64} y1={106} x2={79} y2={106} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={64} y1={111} x2={77} y2={111} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Coffee Cup */}
      <AnimatePresence>
        {hasCoffee && (
          <motion.g
            transform="translate(80, 92)"
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {/* Saucer */}
            <ellipse cx={11} cy={32} rx={14} ry={4} fill="#e2e8f0" opacity="0.7" />
            {/* Cup body */}
            <path d="M2,12 Q0,30 3,32 L19,32 Q22,30 20,12 Z" fill="#0ea5e9" />
            {/* Cup highlight */}
            <path d="M4,13 Q3,25 5,30" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
            {/* Handle */}
            <path d="M20,16 Q28,16 28,22 Q28,28 20,28" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Sleeve */}
            <rect x={2} y={18} width={18} height={7} rx={2} fill="#78350f" />
            {/* Steam */}
            <motion.g animate={{ y: [0, -6, 0], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <path d="M7,8 Q5,3 9,-2" stroke="#d97706" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M14,9 Q12,4 16,0" stroke="#d97706" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Cleaning Cloth */}
      <AnimatePresence>
        {isCleaning && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.path
              d="M76,52 Q88,40 98,52 Q104,64 92,74 Z"
              fill="#fce7f3"
              opacity="0.9"
              animate={{ x: [-8, 8, -8], y: [-4, 4, -4], rotate: [-5, 5, -5] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M76,52 Q88,40 98,52 Q104,64 92,74 Z"
              fill="none"
              stroke="#f9a8d4"
              strokeWidth="1"
              animate={{ x: [-8, 8, -8], y: [-4, 4, -4], rotate: [-5, 5, -5] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main OrionCharacter ──────────────────────────────────────────────────────

const OrionCharacter = ({
  emotion = ORION_EMOTIONS.IDLE,
  animationTrigger,
  isThinking = false,
  xpGainDisplay,
  size = 140,
}) => {
  const [isBlinking, setIsBlinking]   = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const svgRef = useRef(null);

  // ─── Blink Loop (Natural, Slow Timing) ──────────────────────────────────────
  useEffect(() => {
    if (emotion === ORION_EMOTIONS.SLEEPY) return;

    // Eyes blink every 3.5–6 seconds — much more natural than before
    const scheduleBlink = () => {
      const delay = 3500 + Math.random() * 2500;
      const blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        const openTimer = setTimeout(() => {
          setIsBlinking(false);
          // 25% chance of a gentle double-blink with longer gap
          if (Math.random() > 0.75) {
            const doubleBlink = setTimeout(() => {
              setIsBlinking(true);
              const openAgain = setTimeout(() => {
                setIsBlinking(false);
                scheduleBlink();
              }, 130);
              return () => clearTimeout(openAgain);
            }, 200);
            return () => clearTimeout(doubleBlink);
          } else {
            scheduleBlink();
          }
        }, 130);
        return () => clearTimeout(openTimer);
      }, delay);
      return blinkTimer;
    };

    const timer = scheduleBlink();
    return () => clearTimeout(timer);
  }, [emotion]);

  // ─── Mouse Eye Tracking ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || emotion === ORION_EMOTIONS.SLEEPY || isThinking) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height * 0.4;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const distance = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 500);
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

  // ─── Confetti Trigger ──────────────────────────────────────────────────────
  useEffect(() => {
    if (animationTrigger === 'levelUp' || emotion === ORION_EMOTIONS.CELEBRATING) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
  }, [animationTrigger, emotion]);

  // ─── Body Motion Variants ─────────────────────────────────────────────────
  const bodyVariants = {
    idle:         { y: [0, -6, 0],            rotate: 0,           scale: 1,           transition: { y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } } },
    happy:        { y: [0, -10, 0, -6, 0],    rotate: [0,-3,3,-2,0], scale: [1,1.02,1],  transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
    celebrating:  { y: [0,-26,-10,-20,0],     rotate: [0,-5,5,-3,0], scale: [1,1.06,1,1.06,1], transition: { duration: 1.4, repeat: Infinity } },
    thinking:     { y: [0, -4, 0],            rotate: [0,-4,0],    scale: 1,           transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
    focused:      { y: [0, -3, 0],            rotate: 0,           scale: 1,           transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } },
    sleepy:       { y: [0,  4, 0],            rotate: [0,2,0],     scale: [1,0.98,1],  transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } },
    worried:      { y: 0,                     rotate: [-3,3,-3],   scale: 1,           transition: { duration: 0.85, repeat: Infinity } },
    proud:        { y: [0, -9, 0],            rotate: 0,           scale: [1,1.05,1],  transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
    confused:     { y: 0,                     rotate: [0,-10,0],   scale: 1,           transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 } },
    waving:       { y: [0, -8, 0],            rotate: [0,-5,0],    scale: 1,           transition: { duration: 1.2, repeat: 3 } },
    idle_reading: { y: [0, -2, 0],            rotate: 0,           scale: 1,           transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } },
    idle_cleaning:{ y: [0, -3, 0],            rotate: [-2,2,-2],   scale: 1,           transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
    idle_coffee:  { y: [0, -1, 0],            rotate: 0,           scale: 1,           transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } },
    idle_looking: { y: [0, -4, 0],            rotate: [-5,5,-5],   scale: 1,           transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
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

      {/* AI thinking spinner */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full"
            style={{
              border: '3px solid rgba(14, 165, 233, 0.2)',
              borderTopColor: '#0ea5e9',
              boxShadow: '0 0 14px rgba(14, 165, 233, 0.4)',
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
        style={{
          filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
        }}
      >
        <svg
          width={size}
          height={size + 15}
          viewBox="0 0 120 148"
          xmlns="http://www.w3.org/2000/svg"
        >
          <SVGDefs />

          {/* Body (bottom layer) */}
          <OwlBody emotion={emotion} />

          {/* Graduation Cap */}
          <GraduationCap />

          {/* Eyes */}
          <OwlEyes pupilOffset={pupilOffset} isBlinking={isBlinking} emotion={emotion} />

          {/* Premium Glasses (on top of eyes) */}
          <OwlGlasses emotion={emotion} />

          {/* Context accessories */}
          <OwlAccessories emotion={emotion} />

          {/* AI Badge */}
          <g transform="translate(48, 104)" filter="url(#softShadow)">
            <rect x={0} y={0} width={24} height={13} rx={5} fill="#0f172a" />
            <rect x={0} y={0} width={24} height={13} rx={5} fill="#0ea5e9" opacity="0.15" />
            <text x={12} y={9.5} textAnchor="middle" fontSize="7.5" fill="#38bdf8" fontWeight="bold" letterSpacing="0.8">AI</text>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

export default OrionCharacter;
