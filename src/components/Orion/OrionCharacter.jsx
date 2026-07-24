import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ORION_EMOTIONS } from '../../context/OrionContext';

// ─── React overlay particles (DOM layer on top of canvas) ─────────────────────

const ConfettiParticle = ({ index }) => {
  const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f97316'];
  const color  = colors[index % colors.length];
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
      style={{ color, top: '10%', left: `${40 + index * 15}%` }}
      initial={{ opacity: 0, y: 0, x: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: -50, x }}
      transition={{ duration: 2, delay: index * 0.3, repeat: Infinity, repeatDelay: 3 }}
    >{char}</motion.span>
  );
};

const ZZZParticle = ({ index }) => (
  <motion.span
    className="absolute text-slate-400 font-bold pointer-events-none select-none"
    style={{ fontSize: `${10 + index * 3}px`, right: index * 14, top: -(index * 12) }}
    initial={{ opacity: 0, y: 0, x: 0 }}
    animate={{ opacity: [0, 1, 1, 0], y: -30, x: index * 5 }}
    transition={{ duration: 2.5, delay: index * 0.6, repeat: Infinity, repeatDelay: 1 }}
  >Z</motion.span>
);

const HeartParticle = ({ index }) => {
  const x = (Math.random() - 0.5) * 80;
  return (
    <motion.span
      className="absolute text-pink-500 font-bold pointer-events-none select-none drop-shadow-md"
      style={{ fontSize: `${12 + Math.random() * 8}px`, top: '20%', left: '45%' }}
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: -60, x, scale: 1 }}
      transition={{ duration: 2, delay: index * 0.4, repeat: Infinity }}
    >❤️</motion.span>
  );
};

const PettingParticle = ({ index }) => {
  const chars = ['❤️', '💖', '✨', '💕', '✨'];
  const char = chars[index % chars.length];
  const x = (Math.random() - 0.5) * 110;
  const isHeart = char.includes('❤️') || char.includes('💖') || char.includes('💕');
  const colorClass = isHeart ? 'text-pink-500' : 'text-amber-400';
  return (
    <motion.span
      className={`absolute pointer-events-none select-none drop-shadow-md ${colorClass}`}
      style={{ fontSize: `${12 + Math.random() * 8}px`, top: '15%', left: `${35 + Math.random() * 20}%` }}
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.5, rotate: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: -65, x, scale: [0.5, 1.2, 1], rotate: (Math.random() - 0.5) * 90 }}
      transition={{ duration: 1.8, delay: index * 0.28, repeat: Infinity }}
    >{char}</motion.span>
  );
};

const MusicParticle = ({ index }) => {
  const char = index % 2 === 0 ? '♪' : '♫';
  const x = (Math.random() - 0.5) * 100;
  return (
    <motion.span
      className="absolute text-blue-400 font-bold pointer-events-none select-none drop-shadow-md"
      style={{ fontSize: `${14 + Math.random() * 6}px`, top: '30%', left: '45%' }}
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.5, rotate: -20 }}
      animate={{ opacity: [0, 1, 1, 0], y: -80, x, scale: 1, rotate: 20 }}
      transition={{ duration: 3, delay: index * 0.8, repeat: Infinity }}
    >{char}</motion.span>
  );
};

const ThinkingParticle = ({ index }) => {
  // Glow nodes, stars, and binary stream digits
  const symbols = ['1', '✦', '0', '✧', '•', '1', '0', '✦'];
  const symbol = symbols[index % symbols.length];
  
  // Custom trajectories to rise from behind cap/eyes
  const startX = (index % 2 === 0 ? -1 : 1) * (14 + (index * 8) % 18);
  const endX = startX + (Math.random() - 0.5) * 44;
  const endY = -(75 + Math.random() * 45);
  
  const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#34d399'];
  const color = colors[index % colors.length];

  return (
    <motion.span
      className="absolute font-mono select-none pointer-events-none"
      style={{ 
        color, 
        fontSize: symbol === '1' || symbol === '0' ? '10px' : '12px',
        fontWeight: 'bold',
        top: '15%', 
        left: '50%',
        textShadow: `0 0 6px ${color}, 0 0 12px ${color}`
      }}
      initial={{ opacity: 0, x: startX, y: 0, scale: 0.5 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: endY, 
        x: endX, 
        scale: [0.5, 1.2, 1.0, 0.4] 
      }}
      transition={{ 
        duration: 2.0, 
        delay: index * 0.3, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {symbol}
    </motion.span>
  );
};


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

// ─── Emotion animation config table ──────────────────────────────────────────
// bY: bounce amplitude, bF: bounce frequency (Hz)
// wAmp: wing amp (deg), wF: wing freq (Hz)
// eOpen: eye openness (1=normal, 0.05=almost closed)
// ebY: eyebrow offset (positive=raised, negative=furrowed)
// tilt: head tilt degrees, gGlow: glasses glow, shake: worried horizontal shake

const EC = {
  // ── Calm states: breathing only or micro-float ──
  [ORION_EMOTIONS.IDLE]:           { bY: 0,  bF: 0.0,  wAmp: 2,  wF: 0.5,  eOpen: 1.0,  ebY: 0,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.THINKING]:       { bY: 1.5,bF: 0.3,  wAmp: 1,  wF: 0.3,  eOpen: 0.9,  ebY: -2, tilt: -5, gGlow: true,  shake: false },
  [ORION_EMOTIONS.FOCUSED]:        { bY: 1,  bF: 0.2,  wAmp: 1,  wF: 0.2,  eOpen: 1.0,  ebY: 0,  tilt: 0,  gGlow: true,  shake: false },
  [ORION_EMOTIONS.SLEEPY]:         { bY: 2,  bF: 0.15, wAmp: 1,  wF: 0.15, eOpen: 0.05, ebY: -4, tilt: 10, gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_READING]:   { bY: 1,  bF: 0.22, wAmp: 1,  wF: 0.22, eOpen: 0.88, ebY: 0,  tilt: 6,  gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_CLEANING]:  { bY: 1,  bF: 0.22, wAmp: 22, wF: 2.6,  eOpen: 0.9,  ebY: 0,  tilt: -4, gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_COFFEE]:    { bY: 1,  bF: 0.2,  wAmp: 1,  wF: 0.2,  eOpen: 1.0,  ebY: 2,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_LOOKING]:   { bY: 1.5,bF: 0.28, wAmp: 1,  wF: 0.28, eOpen: 1.0,  ebY: 0,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_MUSIC]:     { bY: 2,  bF: 1.5,  wAmp: 1,  wF: 1.5,  eOpen: 0.9,  ebY: 1,  tilt: 4,  gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_STARGAZING]:{ bY: 0.5,bF: 0.15, wAmp: 1,  wF: 0.15, eOpen: 1.0,  ebY: -1, tilt: -12,gGlow: false, shake: false },
  [ORION_EMOTIONS.IDLE_STRETCHING]:{ bY: 2,  bF: 0.35, wAmp: 50, wF: 0.32, eOpen: 1.2,  ebY: 4,  tilt: -8, gGlow: false, shake: false },
  // ── Active states: keep full energy ──
  [ORION_EMOTIONS.HAPPY]:          { bY: 0,  bF: 0.0,  wAmp: 2,  wF: 0.5,  eOpen: 1.1,  ebY: 4,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.CELEBRATING]:    { bY: 22, bF: 1.8,  wAmp: 42, wF: 3.2,  eOpen: 1.2,  ebY: 6,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.WORRIED]:        { bY: 2,  bF: 4.5,  wAmp: 6,  wF: 4.0,  eOpen: 0.88, ebY: -5, tilt: 0,  gGlow: false, shake: true  },
  [ORION_EMOTIONS.PROUD]:          { bY: 7,  bF: 0.85, wAmp: 5,  wF: 0.8,  eOpen: 0.6,  ebY: 5,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.CONFUSED]:       { bY: 2,  bF: 0.55, wAmp: 2,  wF: 0.5,  eOpen: 1.15, ebY: 1,  tilt: 16, gGlow: false, shake: false },
  [ORION_EMOTIONS.WAVING]:         { bY: 7,  bF: 0.9,  wAmp: 5,  wF: 0.8,  eOpen: 1.0,  ebY: 2,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.DETERMINED]:     { bY: 1.5,bF: 0.35, wAmp: 12, wF: 0.8,  eOpen: 1.0,  ebY: -2.5,tilt: 0,  gGlow: true,  shake: false },
  [ORION_EMOTIONS.IDLE_COOKIE]:    { bY: 1.2,bF: 0.22, wAmp: 1,  wF: 0.2,  eOpen: 1.1,  ebY: 2,  tilt: 2,  gGlow: false, shake: false },
};
const DEFAULT_EC = EC[ORION_EMOTIONS.IDLE];

// ─── Canvas draw functions (all in 120×150 internal unit space) ───────────────

function drawShadow(ctx, cx, by) {
  const g = ctx.createRadialGradient(cx, by + 2, 0, cx, by + 2, 30);
  g.addColorStop(0, 'rgba(0,0,0,0.2)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.07)');
  g.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.ellipse(cx, by + 2, 30, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function bodyPath(ctx, cx, cy) {
  // Chubbier, rounder egg — wider belly, softer top
  ctx.beginPath();
  ctx.moveTo(cx, cy - 30);
  ctx.bezierCurveTo(cx + 36, cy - 30, cx + 36, cy + 6, cx + 33, cy + 34);
  ctx.bezierCurveTo(cx + 30, cy + 58, cx + 15, cy + 63, cx, cy + 63);
  ctx.bezierCurveTo(cx - 15, cy + 63, cx - 30, cy + 58, cx - 33, cy + 34);
  ctx.bezierCurveTo(cx - 36, cy + 6, cx - 36, cy - 30, cx, cy - 30);
  ctx.closePath();
}

function drawBody(ctx, cx, cy, bx, by) {
  ctx.save();
  // Breathing scale around belly
  ctx.translate(cx, cy + 10);
  ctx.scale(bx, by);
  ctx.translate(-cx, -(cy + 10));

  // Main body fill — warmer highlight, richer browns
  bodyPath(ctx, cx, cy);
  const bodyG = ctx.createRadialGradient(cx - 10, cy - 22, 2, cx, cy + 10, 52);
  bodyG.addColorStop(0,    '#f07030');  // warm amber highlight
  bodyG.addColorStop(0.25, '#c44010');  // upper-mid warm brown
  bodyG.addColorStop(0.55, '#9a3412');  // core brown
  bodyG.addColorStop(0.82, '#7c2d12');  // lower shadow
  bodyG.addColorStop(1,    '#4c1205');  // deep shadow edge
  ctx.fillStyle = bodyG;
  ctx.fill();

  // Specular highlight (top-left sphere sheen)
  bodyPath(ctx, cx, cy);
  const specG = ctx.createRadialGradient(cx - 14, cy - 26, 0, cx - 6, cy - 12, 34);
  specG.addColorStop(0,    'rgba(255,235,200,0.35)');
  specG.addColorStop(0.45, 'rgba(255,210,160,0.10)');
  specG.addColorStop(1,    'transparent');
  ctx.fillStyle = specG;
  ctx.fill();

  // Bottom shadow (gives rounded, 3D feel)
  bodyPath(ctx, cx, cy);
  const botG = ctx.createRadialGradient(cx, cy + 55, 0, cx, cy + 55, 40);
  botG.addColorStop(0,   'rgba(28,4,0,0.6)');
  botG.addColorStop(0.65, 'rgba(18,2,0,0.12)');
  botG.addColorStop(1,   'transparent');
  ctx.fillStyle = botG;
  ctx.fill();

  // Face mask — heart-shaped, more prominent
  // Draw as a taller oval that's slightly pointed at top, round at bottom
  ctx.beginPath();
  ctx.moveTo(cx, cy + 36); // bottom point
  ctx.bezierCurveTo(cx - 6, cy + 36, cx - 26, cy + 26, cx - 26, cy + 8); // bottom-left
  ctx.bezierCurveTo(cx - 26, cy - 8, cx - 14, cy - 16, cx, cy - 10);  // top-left
  ctx.bezierCurveTo(cx + 14, cy - 16, cx + 26, cy - 8, cx + 26, cy + 8); // top-right
  ctx.bezierCurveTo(cx + 26, cy + 26, cx + 6, cy + 36, cx, cy + 36); // bottom-right
  ctx.closePath();
  const faceG = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy + 10, 34);
  faceG.addColorStop(0,    '#ffffff');
  faceG.addColorStop(0.3,  '#fffbeb');
  faceG.addColorStop(0.65, '#fef3c7');
  faceG.addColorStop(1,    '#fde68a');
  ctx.fillStyle = faceG;
  ctx.fill();

  // Face depth shadow at bottom curve
  ctx.beginPath();
  ctx.moveTo(cx, cy + 36);
  ctx.bezierCurveTo(cx - 6, cy + 36, cx - 26, cy + 26, cx - 26, cy + 8);
  ctx.bezierCurveTo(cx - 26, cy - 8, cx - 14, cy - 16, cx, cy - 10);
  ctx.bezierCurveTo(cx + 14, cy - 16, cx + 26, cy - 8, cx + 26, cy + 8);
  ctx.bezierCurveTo(cx + 26, cy + 26, cx + 6, cy + 36, cx, cy + 36);
  ctx.closePath();
  const faceShG = ctx.createRadialGradient(cx, cy + 30, 2, cx, cy + 30, 22);
  faceShG.addColorStop(0,   'rgba(160,90,0,0.25)');
  faceShG.addColorStop(1,   'transparent');
  ctx.fillStyle = faceShG;
  ctx.fill();

  // Chest feather V-lines (more defined)
  ctx.lineCap = 'round';
  [[cy + 28, 15, 'rgba(155,60,0,0.35)', 2.0], [cy + 37, 11, 'rgba(140,55,0,0.28)', 1.7], [cy + 45, 7, 'rgba(130,50,0,0.22)', 1.5]].forEach(([fy, fw, col, lw]) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx - fw, fy);
    ctx.quadraticCurveTo(cx, fy + 6, cx + fw, fy);
    ctx.stroke();
  });

  ctx.restore();
}

function drawEarTufts(ctx, cx, cy) {
  const pairs = [[-26, -1], [26, 1]];
  pairs.forEach(([dx, dir]) => {
    const tx = cx + dx;
    const ty = cy - 32;
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + dir * 8, ty - 18, tx + dir * 4, ty - 11);
    ctx.quadraticCurveTo(tx + dir * 6, ty - 6, tx + dir * 4, ty + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(tx + dir * 2, ty - 1);
    ctx.quadraticCurveTo(tx + dir * 2, ty - 14, tx + dir * 4, ty - 11);
    ctx.quadraticCurveTo(tx + dir * 5, ty - 6, tx + dir * 4, ty + 1);
    ctx.closePath();
    ctx.fill();
  });
}

function drawWing(ctx, cx, cy, isLeft, angle) {
  const originX = cx + (isLeft ? -30 : 30); // wider attach point
  const originY = cy + 4;
  const dir = isLeft ? -1 : 1;

  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(angle * Math.PI / 180);
  ctx.translate(-originX, -originY);

  // Layer 1: Longest/Back feather
  const gLong = ctx.createLinearGradient(originX, originY, originX + dir * 26, originY + 56);
  gLong.addColorStop(0.0, '#9a3412');
  gLong.addColorStop(0.5, '#7c2d12');
  gLong.addColorStop(1.0, '#4c1205');

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.bezierCurveTo(originX + dir * 24, originY + 8, originX + dir * 30, originY + 34, originX + dir * 16, originY + 56);
  ctx.bezierCurveTo(originX + dir * 10, originY + 44, originX + dir * 4, originY + 22, originX, originY);
  ctx.closePath();
  ctx.fillStyle = gLong;
  ctx.fill();

  // Subtle stroke to define outer back feather
  ctx.strokeStyle = 'rgba(76,18,5,0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Layer 2: Mid feather (overlapping)
  const gMid = ctx.createLinearGradient(originX, originY, originX + dir * 22, originY + 44);
  gMid.addColorStop(0.0, '#ea580c');
  gMid.addColorStop(0.6, '#b45309');
  gMid.addColorStop(1.0, '#7c2d12');

  ctx.beginPath();
  ctx.moveTo(originX, originY + 2);
  ctx.bezierCurveTo(originX + dir * 20, originY + 8, originX + dir * 25, originY + 28, originX + dir * 13, originY + 44);
  ctx.bezierCurveTo(originX + dir * 8, originY + 34, originX + dir * 3, originY + 18, originX, originY + 2);
  ctx.closePath();
  ctx.fillStyle = gMid;

  // Add subtle drop shadow to separate layers
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = dir * 1.2;
  ctx.shadowOffsetY = 1.8;
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; // Reset shadow

  ctx.strokeStyle = 'rgba(124,45,18,0.3)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Layer 3: Shortest/Front feather
  const gShort = ctx.createLinearGradient(originX, originY, originX + dir * 18, originY + 30);
  gShort.addColorStop(0.0, '#ff7a30');
  gShort.addColorStop(0.5, '#ea580c');
  gShort.addColorStop(1.0, '#9a3412');

  ctx.beginPath();
  ctx.moveTo(originX, originY + 4);
  ctx.bezierCurveTo(originX + dir * 15, originY + 8, originX + dir * 18, originY + 22, originX + dir * 10, originY + 32);
  ctx.bezierCurveTo(originX + dir * 5, originY + 26, originX + dir * 2, originY + 14, originX, originY + 4);
  ctx.closePath();
  ctx.fillStyle = gShort;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 3.0;
  ctx.shadowOffsetX = dir * 1.0;
  ctx.shadowOffsetY = 1.5;
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; // Reset shadow

  // Specular reflection sheen on top feather
  const specG = ctx.createRadialGradient(originX + dir * 4, originY + 8, 0, originX + dir * 6, originY + 14, 8);
  specG.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  specG.addColorStop(1, 'transparent');
  ctx.fillStyle = specG;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();
}

function drawSingleEye(ctx, ex, ey, eyeR, pOffX, pOffY, eOpen, emotion, blink) {
  // eyeR = 15 for bigger, more expressive eyes
  ctx.save();

  // Clip to eye boundary so eyelid is masked naturally
  ctx.beginPath();
  ctx.ellipse(ex, ey, eyeR + 1, eyeR + 1, 0, 0, Math.PI * 2);
  ctx.clip();

  // Sclera — pure white center, soft grey rim
  const scleraG = ctx.createRadialGradient(ex - 4, ey - 6, 1, ex, ey, eyeR);
  scleraG.addColorStop(0,    '#ffffff');
  scleraG.addColorStop(0.65, '#f8fafc');
  scleraG.addColorStop(0.88, '#e8eef4');
  scleraG.addColorStop(1,    '#d1dce8');
  ctx.beginPath();
  ctx.ellipse(ex, ey, eyeR, eyeR, 0, 0, Math.PI * 2);
  ctx.fillStyle = scleraG;
  ctx.fill();

  // Inner shadow ring (depth)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const isOpen = !blink && eOpen > 0.2;
  if (isOpen) {
    const px = ex + pOffX;
    const py = ey + pOffY;
    const isFocused = emotion === ORION_EMOTIONS.FOCUSED;
    const isWorried  = emotion === ORION_EMOTIONS.WORRIED;
    const irisR = 10.5; // bigger iris for more expressiveness

    const irisG = ctx.createRadialGradient(px - 3, py - 3.5, 1, px, py, irisR);
    if (isFocused) {
      irisG.addColorStop(0,    '#7dd3fc');
      irisG.addColorStop(0.35, '#38bdf8');
      irisG.addColorStop(0.7,  '#0369a1');
      irisG.addColorStop(1,    '#082f49');
    } else if (isWorried) {
      irisG.addColorStop(0,    '#fca5a5');
      irisG.addColorStop(0.4,  '#ef4444');
      irisG.addColorStop(0.75, '#b91c1c');
      irisG.addColorStop(1,    '#450a0a');
    } else {
      irisG.addColorStop(0,    '#94a3b8'); // rim highlight
      irisG.addColorStop(0.3,  '#475569');
      irisG.addColorStop(0.65, '#1e293b');
      irisG.addColorStop(1,    '#020617');
    }
    // Iris ring
    ctx.beginPath();
    ctx.ellipse(px, py, irisR, irisR, 0, 0, Math.PI * 2);
    ctx.fillStyle = irisG;
    ctx.fill();
    // Limbal ring (dark outer iris edge — like real eyes)
    ctx.strokeStyle = 'rgba(2,6,23,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Pupil
    const pupilR = irisR * 0.52;
    ctx.beginPath();
    ctx.ellipse(px, py, pupilR, pupilR, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000c1a';
    ctx.fill();
    // Primary catch-light (large, offset top-right)
    ctx.beginPath();
    ctx.ellipse(px + 3, py - 4, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    // Secondary catch-light (small, bottom-left)
    ctx.beginPath();
    ctx.ellipse(px - 3.5, py + 3.5, 1.8, 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Happy sparkle
    if (emotion === ORION_EMOTIONS.HAPPY || emotion === ORION_EMOTIONS.CELEBRATING) {
      ctx.beginPath();
      ctx.ellipse(px + 6, py + 5, 2, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251,191,36,0.9)'; // amber/gold sparkle
      ctx.fill();
    }
  } else {
    // Fill the sclera with warm cream so it matches the face mask
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeR, eyeR, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fffbeb';
    ctx.fill();

    // Draw a beautiful curved closed eyelid line (sleeping lash line: ⌒)
    ctx.strokeStyle = '#5c1d07'; // Deep brown lash color
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ex, ey + 4, 9, 1.15 * Math.PI, 1.85 * Math.PI, false);
    ctx.stroke();

    // Add tiny sleeping eyelashes on the outer sides
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    // Left lash tick
    ctx.moveTo(ex - 7, ey - 2);
    ctx.lineTo(ex - 11, ey - 5);
    // Right lash tick
    ctx.moveTo(ex + 7, ey - 2);
    ctx.lineTo(ex + 11, ey - 5);
    ctx.stroke();
  }

  ctx.restore();

  // Outer rim stroke (outside clip)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ex, ey, eyeR, eyeR, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawHeadphones(ctx, cx, cy, t) {
  const hx = cx, hy = cy - 25;
  // Band
  ctx.beginPath();
  ctx.arc(hx, hy, 28, Math.PI, 0);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Ear cups
  [-30, 30].forEach((dx) => {
    ctx.beginPath();
    ctx.roundRect(hx + dx - 5, hy - 4, 10, 24, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    
    // Cup highlight
    ctx.beginPath();
    ctx.roundRect(hx + dx - 2, hy - 2, 4, 20, 2);
    ctx.fillStyle = '#334155';
    ctx.fill();
  });
}

function drawTelescope(ctx, cx, cy) {
  // Translate to the right eye center
  const tx = cx + 18;
  const ty = cy - 17;
  
  ctx.save();
  ctx.translate(tx, ty);
  // Rotate so it points up and to the right (-30 degrees)
  ctx.rotate(-30 * Math.PI / 180);
  
  // Eyepiece is at (0, 0)
  // Tube: from x = 6 to x = 50. Height = 10.
  ctx.beginPath();
  ctx.roundRect(6, -5, 44, 10, 2);
  const tG = ctx.createLinearGradient(6, 0, 50, 0);
  tG.addColorStop(0, '#94a3b8');
  tG.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = tG;
  ctx.fill();
  
  // Lens hood (thick part at the far end)
  ctx.beginPath();
  ctx.roundRect(46, -7, 8, 14, 2);
  ctx.fillStyle = '#334155';
  ctx.fill();
  
  // Eyepiece (small part touching the eye at x = 0 to x = 6)
  ctx.beginPath();
  ctx.roundRect(0, -3, 6, 6, 1);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Stand/Tripod (legs pointing downwards)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(15, 32); // Left leg
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(34, 30); // Right leg
  ctx.stroke();
  
  ctx.restore();
}

function drawHoldingWings(ctx, cx, cy) {
  // Left Wing (holding left side of book)
  ctx.save();
  ctx.translate(cx - 28, cy + 8);
  ctx.rotate(32 * Math.PI / 180); // tilt up slightly

  // Layer 1: Back/long feather cradling the bottom-left of the book
  const gLongL = ctx.createLinearGradient(0, 0, 24, 12);
  gLongL.addColorStop(0, '#9a3412');
  gLongL.addColorStop(1, '#4c1205');
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.bezierCurveTo(15, -4, 28, 6, 26, 16);
  ctx.bezierCurveTo(20, 20, 8, 12, 0, 0);
  ctx.closePath();
  ctx.fillStyle = gLongL; ctx.fill();
  ctx.strokeStyle = 'rgba(76,18,5,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  // Layer 2: Mid feather resting on the left page
  const gMidL = ctx.createLinearGradient(0, -2, 20, 6);
  gMidL.addColorStop(0, '#ea580c');
  gMidL.addColorStop(1, '#7c2d12');
  ctx.beginPath();
  ctx.moveTo(-2, -4);
  ctx.bezierCurveTo(10, -3, 22, 2, 21, 10);
  ctx.bezierCurveTo(15, 14, 6, 6, -2, 0);
  ctx.closePath();
  ctx.fillStyle = gMidL; ctx.fill();
  ctx.stroke();

  // Layer 3: Top/short feather (thumb-like grip on side page)
  const gShortL = ctx.createLinearGradient(0, -2, 14, 2);
  gShortL.addColorStop(0, '#f97316');
  gShortL.addColorStop(1, '#b45309');
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.bezierCurveTo(6, -1, 15, 1, 14, 6);
  ctx.bezierCurveTo(10, 8, 4, 4, -2, 0);
  ctx.closePath();
  ctx.fillStyle = gShortL; ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Right Wing (holding right side of book)
  ctx.save();
  ctx.translate(cx + 28, cy + 8);
  ctx.rotate(-32 * Math.PI / 180); // tilt up slightly

  // Layer 1: Back/long feather cradling the bottom-right of the book
  const gLongR = ctx.createLinearGradient(0, 0, -24, 12);
  gLongR.addColorStop(0, '#9a3412');
  gLongR.addColorStop(1, '#4c1205');
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.bezierCurveTo(-15, -4, -28, 6, -26, 16);
  ctx.bezierCurveTo(-20, 20, -8, 12, 0, 0);
  ctx.closePath();
  ctx.fillStyle = gLongR; ctx.fill();
  ctx.strokeStyle = 'rgba(76,18,5,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  // Layer 2: Mid feather resting on the right page
  const gMidR = ctx.createLinearGradient(0, -2, -20, 6);
  gMidR.addColorStop(0, '#ea580c');
  gMidR.addColorStop(1, '#7c2d12');
  ctx.beginPath();
  ctx.moveTo(2, -4);
  ctx.bezierCurveTo(-10, -3, -22, 2, -21, 10);
  ctx.bezierCurveTo(-15, 14, -6, 6, 2, 0);
  ctx.closePath();
  ctx.fillStyle = gMidR; ctx.fill();
  ctx.stroke();

  // Layer 3: Top/short feather (thumb-like grip on side page)
  const gShortR = ctx.createLinearGradient(0, -2, -14, 2);
  gShortR.addColorStop(0, '#f97316');
  gShortR.addColorStop(1, '#b45309');
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.bezierCurveTo(-6, -1, -15, 1, -14, 6);
  ctx.bezierCurveTo(-10, 8, -4, 4, 2, 0);
  ctx.closePath();
  ctx.fillStyle = gShortR; ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawEyebrows(ctx, cx, cy, ebY, emotion) {
  const eyeLx = cx - 18, eyeRx = cx + 18;
  const baseY  = cy - 34 - ebY;
  const isWorried   = emotion === ORION_EMOTIONS.WORRIED;
  const isHappy     = emotion === ORION_EMOTIONS.HAPPY || emotion === ORION_EMOTIONS.CELEBRATING || emotion === ORION_EMOTIONS.PROUD;
  const isThinkEmo  = emotion === ORION_EMOTIONS.THINKING;
  const isSleepy    = emotion === ORION_EMOTIONS.SLEEPY;

  // Draw with slight shadow for depth
  ctx.strokeStyle = 'rgba(40,10,2,0.22)';
  ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  if (isWorried) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 10, baseY + 1); ctx.quadraticCurveTo(eyeLx, baseY + 8, eyeLx + 10, baseY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 10, baseY); ctx.quadraticCurveTo(eyeRx, baseY + 8, eyeRx + 10, baseY + 1); ctx.stroke();
  } else if (isHappy) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 10, baseY + 3); ctx.quadraticCurveTo(eyeLx, baseY - 5, eyeLx + 10, baseY + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 10, baseY + 3); ctx.quadraticCurveTo(eyeRx, baseY - 5, eyeRx + 10, baseY + 3); ctx.stroke();
  } else if (isThinkEmo) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 9, baseY + 1); ctx.quadraticCurveTo(eyeLx + 2, baseY - 2, eyeLx + 9, baseY + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 9, baseY + 3); ctx.quadraticCurveTo(eyeRx - 2, baseY - 2, eyeRx + 9, baseY + 1); ctx.stroke();
  } else if (isSleepy) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 9, baseY + 3); ctx.quadraticCurveTo(eyeLx, baseY + 1, eyeLx + 9, baseY + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 9, baseY + 4); ctx.quadraticCurveTo(eyeRx, baseY + 1, eyeRx + 9, baseY + 3); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(eyeLx - 10, baseY + 2); ctx.quadraticCurveTo(eyeLx, baseY - 3, eyeLx + 10, baseY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 10, baseY + 2); ctx.quadraticCurveTo(eyeRx, baseY - 3, eyeRx + 10, baseY + 2); ctx.stroke();
  }

  // Draw eyebrows proper (on top of shadow)
  ctx.strokeStyle = '#3e1804'; ctx.lineWidth = 3.2;
  if (isWorried) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 10, baseY); ctx.quadraticCurveTo(eyeLx, baseY + 7, eyeLx + 10, baseY - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 10, baseY - 1); ctx.quadraticCurveTo(eyeRx, baseY + 7, eyeRx + 10, baseY); ctx.stroke();
  } else if (isHappy) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 10, baseY + 2); ctx.quadraticCurveTo(eyeLx, baseY - 6, eyeLx + 10, baseY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 10, baseY + 2); ctx.quadraticCurveTo(eyeRx, baseY - 6, eyeRx + 10, baseY + 2); ctx.stroke();
  } else if (isThinkEmo) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 9, baseY); ctx.quadraticCurveTo(eyeLx + 2, baseY - 3, eyeLx + 9, baseY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 9, baseY + 2); ctx.quadraticCurveTo(eyeRx - 2, baseY - 3, eyeRx + 9, baseY); ctx.stroke();
  } else if (isSleepy) {
    ctx.beginPath(); ctx.moveTo(eyeLx - 9, baseY + 2); ctx.quadraticCurveTo(eyeLx, baseY, eyeLx + 9, baseY + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 9, baseY + 3); ctx.quadraticCurveTo(eyeRx, baseY, eyeRx + 9, baseY + 2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(eyeLx - 10, baseY + 1); ctx.quadraticCurveTo(eyeLx, baseY - 4, eyeLx + 10, baseY + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeRx - 10, baseY + 1); ctx.quadraticCurveTo(eyeRx, baseY - 4, eyeRx + 10, baseY + 1); ctx.stroke();
  }
}

function drawGlasses(ctx, cx, cy, isGlowing, t) {
  const eyeLx = cx - 18, eyeRx = cx + 18;
  const eyeY  = cy - 17;
  const R     = 16; // matches bigger eyes

  // Glow aura
  if (isGlowing) {
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.1;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur  = 12;
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth   = 6;
    [eyeLx, eyeRx].forEach(ex => {
      ctx.beginPath(); ctx.ellipse(ex, eyeY, R + 2, R + 2, 0, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Tinted lens fill
  [eyeLx, eyeRx].forEach(ex => {
    const lg = ctx.createRadialGradient(ex - 4, eyeY - 5, 1, ex, eyeY, R);
    lg.addColorStop(0,   'rgba(186,230,253,0.14)');
    lg.addColorStop(1,   'rgba(3,105,161,0.07)');
    ctx.beginPath(); ctx.ellipse(ex, eyeY, R, R, 0, 0, Math.PI * 2);
    ctx.fillStyle = lg; ctx.fill();
  });

  // Frame gradient
  const fG = ctx.createLinearGradient(0, eyeY - R, 0, eyeY + R);
  if (isGlowing) {
    fG.addColorStop(0, '#7dd3fc'); fG.addColorStop(0.5, '#0ea5e9'); fG.addColorStop(1, '#0369a1');
  } else {
    fG.addColorStop(0, '#64748b'); fG.addColorStop(0.5, '#334155'); fG.addColorStop(1, '#1e293b');
  }

  ctx.strokeStyle = fG;
  ctx.lineWidth   = 3.8;
  [eyeLx, eyeRx].forEach(ex => {
    ctx.beginPath(); ctx.ellipse(ex, eyeY, R, R, 0, 0, Math.PI * 2); ctx.stroke();
  });

  // Frame top highlight (shiny plastic arc)
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  [eyeLx, eyeRx].forEach(ex => {
    ctx.beginPath(); ctx.arc(ex, eyeY, R, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
  });

  // Bridge — tighter, closer to nose
  ctx.strokeStyle = fG; ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(eyeLx + R - 2, eyeY - 3);
  ctx.quadraticCurveTo(cx, eyeY - 6, eyeRx - R + 2, eyeY - 3);
  ctx.stroke();

  // Temple arms
  [[eyeLx - R, -14, -10], [eyeRx + R, 14, 10]].forEach(([sx, dx1, dx2]) => {
    ctx.beginPath();
    ctx.moveTo(sx, eyeY - 5);
    ctx.quadraticCurveTo(sx + dx1, eyeY - 6, sx + dx2, eyeY - 9);
    ctx.stroke();
  });

  // Lens reflection streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.52)';
  ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  [eyeLx, eyeRx].forEach(ex => {
    ctx.beginPath();
    ctx.moveTo(ex - 9, eyeY - 8);
    ctx.quadraticCurveTo(ex - 3, eyeY - 13, ex + 5, eyeY - 10);
    ctx.stroke();
  });
}

function drawBeak(ctx, cx, cy, openAmount = 0) {
  const bx = cx, by = cy + 4;

  // Beak shadow
  ctx.beginPath();
  ctx.moveTo(bx - 8, by - 1);
  ctx.bezierCurveTo(bx - 8, by - 1, bx, by + 13, bx + 8, by - 1);
  ctx.quadraticCurveTo(bx, by - 4, bx - 8, by - 1);
  ctx.fillStyle = '#92400e'; ctx.fill();

  // Beak main
  const bG = ctx.createLinearGradient(bx, by - 5, bx, by + 12);
  bG.addColorStop(0,   '#fde047');
  bG.addColorStop(0.38,'#f59e0b');
  bG.addColorStop(1,   '#b45309');
  ctx.beginPath();
  ctx.moveTo(bx - 7.5, by - 1.5);
  ctx.bezierCurveTo(bx - 7, by - 1, bx, by + 12, bx + 7, by - 1);
  ctx.quadraticCurveTo(bx, by - 6, bx - 7.5, by - 1.5);
  ctx.closePath();
  ctx.fillStyle = bG; ctx.fill();

  // Highlight
  ctx.strokeStyle = 'rgba(253,230,100,0.85)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx - 5, by - 1.5); ctx.quadraticCurveTo(bx, by - 5, bx + 5, by - 1.5); ctx.stroke();

  if (openAmount > 0.05) {
    // Open mouth — dark ellipse at crease seam scaled by openAmount
    const mW = 6.5 * openAmount, mH = 4.5 * openAmount;
    ctx.beginPath();
    ctx.ellipse(bx, by + 2, mW, mH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7f1d1d';
    ctx.fill();
    // Tongue hint when mouth is wide open
    if (openAmount > 0.45) {
      ctx.beginPath();
      ctx.ellipse(bx, by + 2.5 + mH * 0.25, mW * 0.55, mH * 0.45, 0, 0, Math.PI);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
    }
  } else {
    // Crease (closed beak)
    ctx.strokeStyle = 'rgba(180,80,0,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx - 5, by + 1); ctx.quadraticCurveTo(bx, by + 8, bx + 5, by + 1); ctx.stroke();
  }
}

function drawSweatband(ctx, cx, cy) {
  const bx = cx;
  const by = cy - 25; // Forehead level (below cap, above eyes)
  
  ctx.save();
  
  // Sweatband band: wrapped horizontally
  ctx.fillStyle = '#ef4444'; // Bright Red
  ctx.beginPath();
  ctx.roundRect(bx - 18, by - 4, 36, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // White sports stripes/logo detail on the sweatband
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(bx - 10, by - 2, 20, 4, 1);
  ctx.fill();
  
  ctx.restore();
}

function drawCap(ctx, cx, topY, t = 0) {
  const stemTop = topY + 17;
  const stemBot = topY + 29;

  // Stem (trapezoid)
  const stemG = ctx.createLinearGradient(cx, stemTop, cx, stemBot);
  stemG.addColorStop(0, '#475569'); stemG.addColorStop(1, '#0f172a');
  ctx.beginPath();
  ctx.moveTo(cx - 17, stemTop); ctx.lineTo(cx + 17, stemTop);
  ctx.lineTo(cx + 14, stemBot); ctx.lineTo(cx - 14, stemBot);
  ctx.closePath();
  ctx.fillStyle = stemG; ctx.fill();
  // Stem top-face bevel
  ctx.beginPath();
  ctx.moveTo(cx - 17, stemTop); ctx.lineTo(cx + 17, stemTop);
  ctx.lineTo(cx + 14, stemTop + 3); ctx.lineTo(cx - 14, stemTop + 3);
  ctx.closePath(); ctx.fillStyle = '#64748b'; ctx.fill();

  // Mortarboard flat top (diamond shape)
  const hw = 32, midY = topY + 9;
  const points = [[cx, topY], [cx + hw, midY], [cx, midY + 9], [cx - hw, midY]];
  ctx.beginPath();
  points.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
  ctx.closePath();
  const boardG = ctx.createLinearGradient(cx - hw, midY, cx + hw, midY);
  boardG.addColorStop(0, '#1e293b'); boardG.addColorStop(0.5, '#0f172a'); boardG.addColorStop(1, '#1e293b');
  ctx.fillStyle = boardG; ctx.fill();
  // 3D perspective faces
  ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx + hw, midY); ctx.lineTo(cx, midY); ctx.closePath();
  ctx.fillStyle = 'rgba(100,120,150,0.3)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx - hw, midY); ctx.lineTo(cx, midY); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
  ctx.beginPath();
  points.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
  ctx.closePath(); ctx.stroke();

  // Center button
  ctx.beginPath(); ctx.ellipse(cx, midY + 1, 4, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24'; ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.ellipse(cx, midY, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fde68a'; ctx.fill();
  ctx.restore();

  // Tassel (gently swings based on time — feels alive)
  const tasselSwing = Math.sin(t * 2.4) * 4;
  const tx = cx + 22 + tasselSwing, ty = midY + 7 + Math.abs(tasselSwing) * 0.25;
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, midY + 1); ctx.quadraticCurveTo(cx + 12 + tasselSwing * 0.5, midY + 1, tx, ty); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(tx, ty, 5, 3.5, 0.3, 0, Math.PI * 2); ctx.fillStyle = '#d97706'; ctx.fill();
  [[-4, '#f59e0b'], [0, '#fbbf24'], [4, '#f59e0b']].forEach(([dx, col]) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx + dx, ty + 3);
    ctx.quadraticCurveTo(tx + dx - 1, ty + 11, tx + dx, ty + 14);
    ctx.stroke();
  });
}

function drawBowTie(ctx, cx, cy) {
  const bx = cx;
  const by = cy + 13; // Just below beak
  ctx.save();
  
  // Center knot
  ctx.fillStyle = '#dc2626'; // Deep Red
  ctx.beginPath();
  ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Left wing
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - 12, by - 6);
  ctx.lineTo(bx - 12, by + 6);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + 12, by - 6);
  ctx.lineTo(bx + 12, by + 6);
  ctx.closePath();
  ctx.fill();

  // Shading/Lines
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by - 3); ctx.lineTo(bx - 6, by + 3);
  ctx.moveTo(bx + 6, by - 3); ctx.lineTo(bx + 6, by + 3);
  ctx.stroke();

  ctx.restore();
}

function drawCozyScarf(ctx, cx, cy) {
  const sx = cx;
  const sy = cy + 23;
  ctx.save();
  
  // Main neck loop
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#b91c1c'; // Red
  ctx.beginPath();
  ctx.moveTo(sx - 18, sy);
  ctx.quadraticCurveTo(sx, sy + 6, sx + 18, sy);
  ctx.stroke();

  // Stripes on loop
  ctx.strokeStyle = '#fbbf24'; // Gold stripes
  ctx.lineWidth = 3;
  [sx - 12, sx, sx + 12].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x - 1, sy + 1);
    ctx.lineTo(x + 1, sy + 3);
    ctx.stroke();
  });

  // Hanging tail of scarf
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy + 2);
  ctx.quadraticCurveTo(sx + 16, sy + 14, sx + 14, sy + 24);
  ctx.stroke();

  // Scarf fringe/tassel
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx + 12, sy + 24); ctx.lineTo(sx + 10, sy + 29);
  ctx.moveTo(sx + 14, sy + 24); ctx.lineTo(sx + 14, sy + 30);
  ctx.moveTo(sx + 16, sy + 24); ctx.lineTo(sx + 18, sy + 29);
  ctx.stroke();

  ctx.restore();
}

function drawWizardHat(ctx, cx, topY, t = 0) {
  const baseWidth = 44;
  const h = 38;
  const bx = cx;
  const by = topY + 28; // position relative to head
  
  ctx.save();
  
  // Hat brim (oval)
  ctx.fillStyle = '#5b21b6'; // Dark Purple
  ctx.beginPath();
  ctx.ellipse(bx, by, baseWidth / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4c1d95';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hat cone
  ctx.fillStyle = '#6d28d9'; // Mid Purple
  const swing = Math.sin(t * 1.5) * 2;
  ctx.beginPath();
  ctx.moveTo(bx - 16, by - 1);
  ctx.bezierCurveTo(bx - 14, by - 16, bx - 8, by - 30, bx + swing, by - h); // top
  ctx.bezierCurveTo(bx + 4, by - 30, bx + 14, by - 16, bx + 16, by - 1);
  ctx.closePath();
  ctx.fill();

  // Gold Hat Band
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(bx - 16, by - 1);
  ctx.quadraticCurveTo(bx, by + 1.5, bx + 16, by - 1);
  ctx.lineTo(bx + 15, by - 4);
  ctx.quadraticCurveTo(bx, by - 1.5, bx - 15, by - 4);
  ctx.closePath();
  ctx.fill();

  // Little Gold Star on Hat
  ctx.fillStyle = '#fde68a';
  ctx.font = '8px Arial';
  ctx.fillText('★', bx - 5 + swing * 0.5, by - 14);
  ctx.fillText('★', bx + 6 + swing * 0.7, by - 24);

  // Tassel/Star at the tip
  const starX = bx + swing;
  const starY = by - h;
  ctx.beginPath();
  ctx.arc(starX, starY, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  ctx.restore();
}

function drawGoldCrown(ctx, cx, topY) {
  const bx = cx;
  const by = topY + 26;
  ctx.save();
  
  // Base band
  ctx.fillStyle = '#d97706'; // Dark Gold/Amber
  ctx.beginPath();
  ctx.roundRect(bx - 14, by - 2, 28, 4, 1);
  ctx.fill();

  // Shiny Crown spikes
  ctx.fillStyle = '#fbbf24'; // Bright Gold
  ctx.beginPath();
  ctx.moveTo(bx - 14, by - 2);
  ctx.lineTo(bx - 14, by - 12);
  ctx.lineTo(bx - 7, by - 6);
  ctx.lineTo(bx, by - 15); // middle spike tallest
  ctx.lineTo(bx + 7, by - 6);
  ctx.lineTo(bx + 14, by - 12);
  ctx.lineTo(bx + 14, by - 2);
  ctx.closePath();
  ctx.fill();

  // Jewels (red/blue dots)
  ctx.fillStyle = '#ef4444'; // Red jewel in center
  ctx.beginPath(); ctx.arc(bx, by - 8, 2, 0, Math.PI * 2); ctx.fill();
  
  ctx.fillStyle = '#3b82f6'; // Blue jewels on sides
  ctx.beginPath(); ctx.arc(bx - 9, by - 6, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + 9, by - 6, 1.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawCyberGlasses(ctx, cx, cy, t) {
  const eyeY = cy - 17;
  ctx.save();

  // Outer glow
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;

  // Visor band across both eyes
  ctx.fillStyle = 'rgba(8, 47, 73, 0.85)'; // Dark cyan glass
  ctx.beginPath();
  ctx.roundRect(cx - 36, eyeY - 14, 72, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0; // Reset shadow

  // Glowing tech grid/lines
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 1;
  // Horizontal scan line animating
  const scanY = eyeY - 10 + ((t * 15) % 20);
  if (scanY < eyeY + 12) {
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - 32, scanY);
    ctx.lineTo(cx + 32, scanY);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  // Digital brackets
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1.5;
  // Left bracket
  ctx.beginPath();
  ctx.moveTo(cx - 30, eyeY - 8);
  ctx.lineTo(cx - 33, eyeY - 8);
  ctx.lineTo(cx - 33, eyeY + 8);
  ctx.lineTo(cx - 30, eyeY + 8);
  ctx.stroke();

  // Right bracket
  ctx.beginPath();
  ctx.moveTo(cx + 30, eyeY - 8);
  ctx.lineTo(cx + 33, eyeY - 8);
  ctx.lineTo(cx + 33, eyeY + 8);
  ctx.lineTo(cx + 30, eyeY + 8);
  ctx.stroke();

  ctx.restore();
}

function drawFeet(ctx, cx, fy) {
  const fG = ctx.createLinearGradient(cx, fy, cx, fy + 13);
  fG.addColorStop(0, '#f97316'); fG.addColorStop(1, '#c2410c');

  [-17, 17].forEach((dx, side) => {
    const fx = cx + dx;
    // Ankle
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.bezierCurveTo(fx + (side ? 2 : -2), fy + 6, fx + (side ? 4 : -4), fy + 8, fx + (side ? 5 : -5), fy + 10);
    ctx.lineTo(fx + (side ? -5 : 5), fy + 10);
    ctx.bezierCurveTo(fx + (side ? -4 : 4), fy + 8, fx + (side ? -2 : 2), fy + 6, fx, fy);
    ctx.fillStyle = fG; ctx.fill();

    // Toes
    const toeOffsets = side ? [6, 0, -6] : [-6, 0, 6];
    toeOffsets.forEach((tx, i) => {
      ctx.beginPath();
      ctx.ellipse(fx + tx, fy + 13, 3.8, 2.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = i === 1 ? '#f97316' : '#ea580c';
      ctx.fill();
    });
  });
}

function drawAIBadge(ctx, cx, by) {
  // Sleeker, slightly wider pill container for a modern tech look
  const w = 32, h = 15, r = 7.5;
  const bx = cx - w / 2;

  ctx.save();

  // Subtle outer drop shadow glow
  ctx.shadowColor = 'rgba(14, 165, 233, 0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;

  // Draw capsule background path
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, r);
  
  // Dark Glassmorphism background gradient
  const bgG = ctx.createLinearGradient(bx, by, bx, by + h);
  bgG.addColorStop(0.0, 'rgba(15, 23, 42, 0.9)');
  bgG.addColorStop(1.0, 'rgba(30, 41, 59, 0.95)');
  ctx.fillStyle = bgG;
  ctx.fill();
  
  // Disable shadow for internal details
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Diagonal gloss shine highlight
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, r);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx - 5, by - 5);
  ctx.lineTo(bx + w + 5, by + h + 5);
  ctx.stroke();
  ctx.restore();

  // Futuristic cyber gradient border
  const borderG = ctx.createLinearGradient(bx, by, bx + w, by);
  borderG.addColorStop(0.0, '#38bdf8'); // cyan
  borderG.addColorStop(0.5, '#6366f1'); // indigo
  borderG.addColorStop(1.0, '#a855f7'); // purple
  ctx.strokeStyle = borderG;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, r);
  ctx.stroke();

  // Glowing "AI" label text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Shift slightly to the left to balance the active status LED dot on the right
  ctx.fillText('AI', cx - 2.5, by + h / 2 + 0.5);

  // Tiny glowing active status LED indicator dot
  const dotX = cx + 8;
  const dotY = by + h / 2;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 1.3, 0, Math.PI * 2);
  ctx.fillStyle = '#4ade80'; // Emerald green
  ctx.fill();
  
  // LED outer soft glow
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 3.0, 0, Math.PI * 2);
  ctx.fillStyle = '#4ade80';
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawBook(ctx, cx, cy, t = 0) {
  // Open book held at chest level - left page + right page
  const bx = cx, by = cy + 22; // front of chest
  
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(-0.08); // slight tilt, feels natural
  
  const pw = 24, ph = 30, corner = 3;

  // Drop shadow centered
  ctx.save(); ctx.globalAlpha = 0.18;
  ctx.beginPath(); ctx.roundRect(-pw + 2, -ph / 2 + 3, pw * 2, ph, corner);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();

  // --- LEFT PAGE ---
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-pw, -ph / 2, pw, ph, [corner, 0, 0, corner]);
  const lgL = ctx.createLinearGradient(-pw, 0, 0, 0);
  lgL.addColorStop(0, '#e2e8f0'); lgL.addColorStop(1, '#f8fafc');
  ctx.fillStyle = lgL; ctx.fill();
  // Lines on left page
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const lw = i % 3 === 2 ? pw * 0.55 : pw * 0.8;
    ctx.beginPath();
    ctx.moveTo(-pw + 4, -ph / 2 + 7 + i * 4);
    ctx.lineTo(-pw + 4 + lw, -ph / 2 + 7 + i * 4);
    ctx.stroke();
  }
  ctx.restore();

  // --- RIGHT PAGE ---
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, -ph / 2, pw, ph, [0, corner, corner, 0]);
  const lgR = ctx.createLinearGradient(0, 0, pw, 0);
  lgR.addColorStop(0, '#f8fafc'); lgR.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = lgR; ctx.fill();
  // Lines on right page
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const lw = i % 3 === 0 ? pw * 0.55 : pw * 0.78;
    ctx.beginPath();
    ctx.moveTo(4, -ph / 2 + 7 + i * 4);
    ctx.lineTo(4 + lw, -ph / 2 + 7 + i * 4);
    ctx.stroke();
  }
  ctx.restore();

  // --- SPINE ---
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-2, -ph / 2, 4, ph, 1);
  const spineG = ctx.createLinearGradient(-2, 0, 2, 0);
  spineG.addColorStop(0, '#1e3a8a'); spineG.addColorStop(1, '#3b5fc5');
  ctx.fillStyle = spineG; ctx.fill();
  // Spine cap/detail
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.arc(0, -ph / 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // --- COVER edges (bottom) ---
  ctx.save(); ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.roundRect(-pw, ph / 2 - 3, pw * 2, 3, [0, 0, corner, corner]);
  ctx.fillStyle = '#1e3a8a'; ctx.fill();
  ctx.restore();

  // Animated page turn glint on right
  const glint = (Math.sin(t * 0.8) + 1) / 2;
  ctx.save(); ctx.globalAlpha = glint * 0.15;
  ctx.beginPath(); ctx.roundRect(0, -ph / 2, pw, ph, [0, corner, corner, 0]);
  ctx.fillStyle = '#bfdbfe'; ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawClipboard(ctx, cx, cy) {
  const bx = cx - 22, by = cy + 34, bw = 44, bh = 40;
  // Board
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3);
  ctx.fillStyle = '#8b5a2b'; ctx.fill();
  
  // Paper
  ctx.beginPath(); ctx.roundRect(bx + 3, by + 4, bw - 6, bh - 8, 1);
  ctx.fillStyle = '#f8fafc'; ctx.fill();
  
  // Lines on paper
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx + 8, by + 12); ctx.lineTo(bx + 36, by + 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 8, by + 18); ctx.lineTo(bx + 32, by + 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 8, by + 24); ctx.lineTo(bx + 36, by + 24); ctx.stroke();

  // Clip
  ctx.beginPath(); ctx.roundRect(cx - 8, by - 2, 16, 8, 2);
  ctx.fillStyle = '#94a3b8'; ctx.fill();
  ctx.beginPath(); ctx.roundRect(cx - 10, by, 20, 3, 1);
  ctx.fillStyle = '#cbd5e1'; ctx.fill();
}

function drawCoffeeCup(ctx, cx, cy, t) {
  // Move cup to mouth level with up/down drinking motion
  const cpx = cx + 16;
  const cpy = cy - 2 + Math.sin(t * 8) * 3;

  ctx.save();
  ctx.translate(cpx, cpy);
  
  // Calculate tilt angle when raised near the beak (Math.sin(t * 8) is negative)
  const sipFactor = Math.sin(t * 8);
  const tiltAngle = (sipFactor < 0) ? (sipFactor * -22) * Math.PI / 180 : 0; // tilt up to 22 degrees
  ctx.rotate(tiltAngle);

  // Translate back relative to local coordinates (so cup draws around 0,0)
  ctx.translate(-cpx, -cpy);

  // Steam (animated, fades out when tilted to drink!)
  ctx.save();
  ctx.globalAlpha = (1 - Math.max(0, -sipFactor)) * (0.55 + Math.sin(t * 3) * 0.3);
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  const so = Math.sin(t * 2) * 2;
  ctx.beginPath(); ctx.moveTo(cpx - 4, cpy - 6); ctx.quadraticCurveTo(cpx - 6 + so, cpy - 12, cpx - 3 + so, cpy - 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cpx + 2, cpy - 5); ctx.quadraticCurveTo(cpx + 4 + so, cpy - 11, cpx + 2 + so, cpy - 17); ctx.stroke();
  ctx.restore();

  // Saucer
  ctx.beginPath(); ctx.ellipse(cpx, cpy + 17, 14, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e2e8f0'; ctx.fill();

  // Cup body
  ctx.beginPath();
  ctx.moveTo(cpx - 10, cpy);
  ctx.lineTo(cpx + 10, cpy);
  ctx.bezierCurveTo(cpx + 12, cpy, cpx + 12, cpy + 16, cpx + 10, cpy + 16);
  ctx.lineTo(cpx - 10, cpy + 16);
  ctx.bezierCurveTo(cpx - 12, cpy + 16, cpx - 12, cpy, cpx - 10, cpy);
  ctx.closePath();
  const cupG = ctx.createLinearGradient(cpx - 12, cpy, cpx + 12, cpy);
  cupG.addColorStop(0, '#0284c7'); cupG.addColorStop(0.4, '#0ea5e9'); cupG.addColorStop(1, '#0369a1');
  ctx.fillStyle = cupG; ctx.fill();

  // Sleeve band
  ctx.beginPath();
  ctx.moveTo(cpx - 11, cpy + 5); ctx.lineTo(cpx + 11, cpy + 5);
  ctx.lineTo(cpx + 10, cpy + 11); ctx.lineTo(cpx - 10, cpy + 11); ctx.closePath();
  ctx.fillStyle = '#78350f'; ctx.fill();

  // Handle
  ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cpx + 10, cpy + 3);
  ctx.bezierCurveTo(cpx + 18, cpy + 3, cpx + 18, cpy + 13, cpx + 10, cpy + 13);
  ctx.stroke();

  ctx.restore(); // restores the translate/rotate transform matrix
}

function drawCookieSnack(ctx, cx, cy, t) {
  // Center of cookie: right wing wraps near beak. Beak is around cx, cy.
  // We offset the cookie to his beak level cy - 4, moving up and down to feed himself
  const bx = cx + 16;
  const by = cy - 2 + Math.sin(t * 8) * 3; // feeding motion

  ctx.save();
  
  // Draw the cookie base (golden brown cookie circle)
  ctx.fillStyle = '#d97706'; // Golden brown cookie color
  ctx.beginPath();
  ctx.arc(bx, by, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Chocolate chips (dark brown spots)
  ctx.fillStyle = '#451a03'; // Chocolate dark brown
  // Chip 1
  ctx.beginPath(); ctx.arc(bx - 3, by - 2, 1.6, 0, Math.PI * 2); ctx.fill();
  // Chip 2
  ctx.beginPath(); ctx.arc(bx + 2, by - 3, 1.4, 0, Math.PI * 2); ctx.fill();
  // Chip 3
  ctx.beginPath(); ctx.arc(bx - 2, by + 3, 1.8, 0, Math.PI * 2); ctx.fill();
  // Chip 4
  ctx.beginPath(); ctx.arc(bx + 3, by + 2, 1.2, 0, Math.PI * 2); ctx.fill();

  // Draw bite marks
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(bx - 6, by - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.arc(bx - 7, by + 1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();

  // Draw cookie crumbs falling down!
  ctx.save();
  ctx.fillStyle = '#d97706';
  const crumbPhase = (t * 6) % 1;
  const crumbY1 = by + 6 + crumbPhase * 24;
  const crumbY2 = by + 4 + ((t * 6 + 0.5) % 1) * 24;
  // Crumb 1
  ctx.beginPath(); ctx.arc(bx - 3, crumbY1, 1.0, 0, Math.PI * 2); ctx.fill();
  // Crumb 2
  ctx.beginPath(); ctx.arc(bx + 1, crumbY2, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCleaningCloth(ctx, cx, cy, t) {
  const clx = cx + 24, cly = cy - 18;
  const sx = Math.sin(t * 5) * 8, sy = Math.sin(t * 5) * 3.5;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.beginPath();
  ctx.moveTo(clx, cly);
  ctx.bezierCurveTo(clx + 12, cly - 8, clx + 18, cly + 5, clx + 10, cly + 14);
  ctx.bezierCurveTo(clx + 2, cly + 18, clx - 6, cly + 10, clx - 3, cly + 2);
  ctx.closePath();
  const clothG = ctx.createRadialGradient(clx + 4, cly + 5, 2, clx + 4, cly + 5, 14);
  clothG.addColorStop(0, '#fce7f3'); clothG.addColorStop(1, '#fbcfe8');
  ctx.fillStyle = clothG; ctx.fill();
  ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

// ─── Main OrionCharacter — Canvas-based ──────────────────────────────────────

const OrionCharacter = ({
  emotion = ORION_EMOTIONS.IDLE,
  animationTrigger,
  isThinking = false,
  xpGainDisplay,
  isPetting = false,
  isDragging = false,
  isSpeaking = false,
  contextPath = '',
  size = 140,
  accessories = [],
  walkDirection = 0,
}) => {
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const emotionRef   = useRef(emotion);
  const blinkRef     = useRef(false);
  const pupilRef       = useRef({ px: 0, py: 0 });
  const lerpCfgRef     = useRef({ ...DEFAULT_EC });   // smooth emotion transition state
  const isSpeakingRef  = useRef(false);
  const mouseDistRef   = useRef(1000);
  const contextPathRef = useRef(contextPath);
  const accessoriesRef = useRef(accessories);
  const walkDirectionRef = useRef(walkDirection);
  const [showConfetti, setShowConfetti] = useState(false);

  // Sync emotion ref whenever prop changes
  useEffect(() => { emotionRef.current = emotion; }, [emotion]);

  // Sync isSpeaking ref whenever prop changes (avoids stale closure in rAF)
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // Sync contextPath and accessories refs
  useEffect(() => { contextPathRef.current = contextPath; }, [contextPath]);
  useEffect(() => { accessoriesRef.current = accessories; }, [accessories]);
  useEffect(() => { walkDirectionRef.current = walkDirection; }, [walkDirection]);

  // ── Blink loop (ref-based, no re-renders) ──────────────────────────────────
  useEffect(() => {
    let blinkTimeout;
    const blink = () => {
      const delay = 3500 + Math.random() * 2500; // 3.5–6s between blinks
      blinkTimeout = setTimeout(() => {
        if (emotionRef.current === ORION_EMOTIONS.SLEEPY) { blink(); return; }
        blinkRef.current = true;
        setTimeout(() => {
          blinkRef.current = false;
          // ~25% chance of double-blink
          if (Math.random() > 0.75) {
            setTimeout(() => {
              blinkRef.current = true;
              setTimeout(() => { blinkRef.current = false; blink(); }, 130);
            }, 200);
          } else { blink(); }
        }, 130);
      }, delay);
    };
    blink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // ── Mouse eye tracking ────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const eyeCX = rect.left + rect.width * 0.5;
      const eyeCY = rect.top  + rect.height * 0.38;
      const dx = e.clientX - eyeCX, dy = e.clientY - eyeCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouseDistRef.current = dist;
      const tFactor = Math.min(1, dist / 400);
      const angle = Math.atan2(dy, dx);
      pupilRef.current = { px: Math.cos(angle) * tFactor * 4.5, py: Math.sin(angle) * tFactor * 4.5 };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── Confetti trigger ───────────────────────────────────────────────────────
  useEffect(() => {
    if (animationTrigger === 'levelUp' || emotion === ORION_EMOTIONS.CELEBRATING) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
  }, [animationTrigger, emotion]);

  // ── Canvas setup + render loop ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = size;
    const H   = Math.round(size * 1.25); // 120:150 aspect ratio
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    const scale = (W / 152) * dpr; // Uniform scale: both X and Y

    let lastT = 0;
    let phaseB = 0;
    let phaseW = 0;

    const render = (ts) => {
      const t  = ts / 1000;
      const dt = lastT ? t - lastT : 0;
      lastT = t;

      const em = emotionRef.current || ORION_EMOTIONS.IDLE;
      const targetCfg = EC[em] || DEFAULT_EC;

      // ── Smooth lerp of physics params toward target emotion config ──
      // Creates buttery transitions instead of jarring state snaps (~18 frames to 95%)
      const lc = lerpCfgRef.current;
      const lf = 0.055;
      lc.bY    += (targetCfg.bY    - lc.bY)    * lf;
      lc.bF    += (targetCfg.bF    - lc.bF)    * lf;
      lc.wAmp  += (targetCfg.wAmp  - lc.wAmp)  * lf;
      lc.wF    += (targetCfg.wF    - lc.wF)    * lf;
      lc.eOpen += (targetCfg.eOpen - lc.eOpen) * lf;
      lc.ebY   += (targetCfg.ebY   - lc.ebY)   * lf;
      lc.tilt  += (targetCfg.tilt  - lc.tilt)  * lf;
      lc.gGlow  = targetCfg.gGlow;  // booleans snap immediately
      lc.shake  = targetCfg.shake;
      const cfg = lc;
      const { px: puffX, py: puffY } = pupilRef.current;
      const blink = blinkRef.current;

      // ── Proximity Glow ──
      // The canvas element gets a dynamic drop-shadow based on mouse distance
      const mDist = mouseDistRef.current;
      const glowIntensity = Math.max(0, 1 - (mDist / 250)); // Glows when within 250px
      if (glowIntensity > 0) {
        canvas.style.filter = `drop-shadow(0 12px 24px rgba(0,0,0,0.28)) drop-shadow(0 4px 8px rgba(0,0,0,0.14)) drop-shadow(0 0 ${10 + glowIntensity * 40}px rgba(251, 146, 60, ${glowIntensity * 0.7}))`;
      } else {
        canvas.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.28)) drop-shadow(0 4px 8px rgba(0,0,0,0.14))';
      }

      // Accumulate phase properly based on current lerped frequency
      phaseB += cfg.bF * dt;
      phaseW += cfg.wF * dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);

      // Body center (internal coords)
      const cx = 76;
      const baseCY = 72;

      // Bounce / shake (disabled if dragged to let him hang)
      const bounceY = (cfg.shake || isDragging)
        ? 0
        : Math.sin(phaseB * Math.PI * 2) * cfg.bY;
      const shakeX = cfg.shake
        ? Math.sin(phaseB * Math.PI * 2) * 3
        : 0;

      // When dragging, he's lifted up slightly
      const dragYOffset = isDragging ? -10 : 0;
      const cy = baseCY + bounceY + dragYOffset;
      const bodyBottom = cy + 56;

      // Breathing (±1.8% — primary life signal for idle)
      const breathX = isDragging ? 0.95 : 1 + Math.sin(t * 0.9) * 0.018; // thinner when dragged (stretch)
      const breathY = isDragging ? 1.1 : 1 - Math.sin(t * 0.9) * 0.018;  // taller when dragged

      // Wing angles (flap wildly if dragged, calm otherwise)
      const leftAngle  = isDragging 
        ? Math.sin(t * 12) * 35 
        : Math.sin(phaseW * Math.PI * 2) * cfg.wAmp;
      const rightAngle = isDragging
        ? -Math.sin(t * 12) * 35 
        : (em === ORION_EMOTIONS.WAVING
            ? Math.sin(t * 5 * Math.PI * 2) * 44
            : (em === ORION_EMOTIONS.IDLE_COOKIE)
                ? -68 + Math.sin(t * 8) * 8
                : -Math.sin(phaseW * Math.PI * 2) * cfg.wAmp);

      // Eyelids close when petting
      const eOpen = isPetting ? 0.05 : cfg.eOpen;

      // Head tilt (confused oscillates)
      const headTilt = em === ORION_EMOTIONS.CONFUSED
        ? Math.sin(t * 1.2) * cfg.tilt
        : cfg.tilt;

      // Eyebrow subtle breathing
      const ebY = cfg.ebY + Math.sin(t * 0.7) * 0.4;

      // ── Beak open amount: fast chatter when speaking, slow yawn when stretching ──
      const isSpeakingNow = isSpeakingRef.current;
      const beakOpen = isSpeakingNow
        ? (Math.sin(t * 9) * 0.5 + 0.5) * 0.7              // speech: rapid open/close
        : (em === ORION_EMOTIONS.IDLE_STRETCHING
            ? Math.max(0, Math.sin(phaseW * Math.PI * 2)) * 0.85  // yawn: peaks with wings
            : 0);

      // ── Head bob: gentle vertical nod synced with music beat ──
      const headBobY = (em === ORION_EMOTIONS.IDLE_MUSIC)
        ? Math.sin(phaseW * Math.PI * 2 + Math.PI * 0.5) * 2.5
        : 0;

      ctx.save();
      ctx.translate(shakeX, 0);

      // 1. Ground shadow
      drawShadow(ctx, cx, bodyBottom);

      // 2. Body + face mask
      drawBody(ctx, cx, cy, breathX, breathY);

      // Draw neck accessories (Bow tie / Cozy scarf)
      if (accessoriesRef.current.includes('bow_tie')) {
        drawBowTie(ctx, cx, cy);
      }
      if (accessoriesRef.current.includes('cozy_scarf')) {
        drawCozyScarf(ctx, cx, cy);
      }

      const isReading = em === ORION_EMOTIONS.IDLE_READING || em === ORION_EMOTIONS.FOCUSED;

      // 3. Book BEHIND right wing (so wing wraps over the book)
      if (!isDragging) {
        if (isReading) drawBook(ctx, cx, cy, t);
      }

      // 4. Wings (either holding book or default flapping)
      if (!isDragging && isReading) {
        drawHoldingWings(ctx, cx, cy);
      } else {
        // Left wing (in front of body)
        drawWing(ctx, cx, cy, true, leftAngle);
        // Right wing (in front of body)
        drawWing(ctx, cx, cy, false, rightAngle);
      }

      // 5. Head group (with tilt)
      const headPivotY = cy - 10;
      ctx.save();
      ctx.translate(cx, headPivotY);
      ctx.rotate(headTilt * Math.PI / 180);
      ctx.translate(-cx, -headPivotY);
      // Additional vertical bob (e.g. nodding to music) applied after tilt
      if (headBobY) ctx.translate(0, headBobY);

      drawEarTufts(ctx, cx, cy);
      
      // Draw head accessory (Wizard hat / Gold crown / default Cap)
      if (accessoriesRef.current.includes('wizard_hat')) {
        drawWizardHat(ctx, cx, cy - 50, t);
      } else if (accessoriesRef.current.includes('gold_crown')) {
        drawGoldCrown(ctx, cx, cy - 50);
      } else {
        drawCap(ctx, cx, cy - 50, t);
      }

      drawEyebrows(ctx, cx, cy, isPetting ? -2 : ebY, em);

      if (em === ORION_EMOTIONS.DETERMINED) {
        drawSweatband(ctx, cx, cy);
      }

      const isStargazing = em === ORION_EMOTIONS.IDLE_STARGAZING;
      const leftEyeOpen = isStargazing ? 0.05 : eOpen;
      const rightEyeOpen = isStargazing ? 1.0 : eOpen;
      const leftEyeBlink = isStargazing ? false : blink;

      // Force pupil focus downward at the book when reading
      let pupilX = puffX;
      let pupilY = puffY;
      if (isReading) {
        pupilX = 0;
        pupilY = 3.5;
      } else if (em === ORION_EMOTIONS.IDLE_CLEANING) {
        pupilX = -3.5;
        pupilY = -1;
      } else if (walkDirectionRef.current !== 0) {
        pupilX = walkDirectionRef.current * 3.5;
        pupilY = 0;
      }

      drawSingleEye(ctx, cx - 18, cy - 17, 15, pupilX, pupilY, leftEyeOpen, em, leftEyeBlink);
      drawSingleEye(ctx, cx + 18, cy - 17, 15, pupilX, pupilY, rightEyeOpen, em, blink);
      drawBeak(ctx, cx, cy, beakOpen);

      // Draw eyes accessory (Cyber glasses / default Glasses)
      if (accessoriesRef.current.includes('cyber_glasses')) {
        drawCyberGlasses(ctx, cx, cy, t);
      } else {
        drawGlasses(ctx, cx, cy, cfg.gGlow, t);
      }

      // Draw telescope on top of right eye so it tilts and rotates with the head
      if (em === ORION_EMOTIONS.IDLE_STARGAZING) {
        drawTelescope(ctx, cx, cy);
      }

      ctx.restore(); // head tilt

      // 6. Feet (dangle if dragged)
      if (isDragging) {
        ctx.save();
        ctx.translate(cx, bodyBottom);
        ctx.rotate(Math.sin(t * 4) * 0.1);
        drawFeet(ctx, 0, 0); // Need to adjust drawFeet to handle origin or translate
        ctx.restore();
      } else {
        drawFeet(ctx, cx, bodyBottom);
      }

      // 7. AI Badge
      drawAIBadge(ctx, cx, cy + 40);

      // 8. Context accessories
      if (em === ORION_EMOTIONS.IDLE_MUSIC) {
        drawHeadphones(ctx, cx, cy, t);
      }
      
      if (contextPathRef.current === '/dashboard' && em === ORION_EMOTIONS.IDLE) {
        drawClipboard(ctx, cx, cy);
      } else {
        if (em === ORION_EMOTIONS.IDLE_COFFEE) drawCoffeeCup(ctx, cx, cy, t);
        if (em === ORION_EMOTIONS.IDLE_COOKIE) drawCookieSnack(ctx, cx, cy, t);
        if (em === ORION_EMOTIONS.IDLE_CLEANING) drawCleaningCloth(ctx, cx, cy, t);
      }

      ctx.restore(); // shakeX
      ctx.restore(); // scale

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  const W = size;
  const H = Math.round(size * 1.25);

  return (
    <div className="relative select-none" style={{ width: W, height: H + 20 }}>

      {/* XP Popup */}
      <AnimatePresence>
        {xpGainDisplay && <XPPopup key="xp" amount={xpGainDisplay.amount} label={xpGainDisplay.label} />}
      </AnimatePresence>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(24)].map((_, i) => <ConfettiParticle key={i} index={i} />)}
        </div>
      )}

      {/* Floating emotion particles */}
      <AnimatePresence>
        {emotion === ORION_EMOTIONS.THINKING && (<>
          <FloatingParticle key="q1" char="?" index={0} color="#8b5cf6" />
          <FloatingParticle key="q2" char="?" index={1} color="#a78bfa" />
        </>)}
        {emotion === ORION_EMOTIONS.CONFUSED && (<>
          <FloatingParticle key="c1" char="?" index={0} color="#f59e0b" />
          <FloatingParticle key="c2" char="?" index={2} color="#fbbf24" />
        </>)}
        {emotion === ORION_EMOTIONS.SLEEPY && (
          <div className="absolute" style={{ top: 0, right: 0 }}>
            <ZZZParticle index={0} /><ZZZParticle index={1} /><ZZZParticle index={2} />
          </div>
        )}
        {(emotion === ORION_EMOTIONS.HAPPY || emotion === ORION_EMOTIONS.CELEBRATING || emotion === ORION_EMOTIONS.PROUD) && !isPetting && (<>
          <FloatingParticle key="s1" char="⭐" index={0} color="#fbbf24" />
          <FloatingParticle key="s2" char="✨" index={2} color="#f59e0b" />
        </>)}
        {isPetting && (<>
          <PettingParticle key="p1" index={0} />
          <PettingParticle key="p2" index={1} />
          <PettingParticle key="p3" index={2} />
          <PettingParticle key="p4" index={3} />
          <PettingParticle key="p5" index={4} />
        </>)}
        {emotion === ORION_EMOTIONS.IDLE_MUSIC && (<>
          <MusicParticle key="m1" index={0} />
          <MusicParticle key="m2" index={1} />
          <MusicParticle key="m3" index={2} />
        </>)}
        {emotion === ORION_EMOTIONS.IDLE_STARGAZING && (<>
          <FloatingParticle key="st1" char="✨" index={0} color="#fbbf24" />
          <FloatingParticle key="st2" char="⭐" index={2} color="#fcd34d" />
        </>)}
        {isThinking && (<>
          {[...Array(8)].map((_, i) => (
            <ThinkingParticle key={`think-${i}`} index={i} />
          ))}
        </>)}
      </AnimatePresence>


      {/* The canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.28)) drop-shadow(0 4px 8px rgba(0,0,0,0.14))', transition: 'filter 0.1s ease-out' }}
      />
    </div>
  );
};

export default OrionCharacter;
