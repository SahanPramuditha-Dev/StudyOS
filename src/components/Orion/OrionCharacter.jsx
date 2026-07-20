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
  // ── Active states: keep full energy ──
  [ORION_EMOTIONS.HAPPY]:          { bY: 0,  bF: 0.0,  wAmp: 2,  wF: 0.5,  eOpen: 1.1,  ebY: 4,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.CELEBRATING]:    { bY: 22, bF: 1.8,  wAmp: 42, wF: 3.2,  eOpen: 1.2,  ebY: 6,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.WORRIED]:        { bY: 2,  bF: 4.5,  wAmp: 6,  wF: 4.0,  eOpen: 0.88, ebY: -5, tilt: 0,  gGlow: false, shake: true  },
  [ORION_EMOTIONS.PROUD]:          { bY: 7,  bF: 0.85, wAmp: 5,  wF: 0.8,  eOpen: 0.6,  ebY: 5,  tilt: 0,  gGlow: false, shake: false },
  [ORION_EMOTIONS.CONFUSED]:       { bY: 2,  bF: 0.55, wAmp: 2,  wF: 0.5,  eOpen: 1.15, ebY: 1,  tilt: 16, gGlow: false, shake: false },
  [ORION_EMOTIONS.WAVING]:         { bY: 7,  bF: 0.9,  wAmp: 5,  wF: 0.8,  eOpen: 1.0,  ebY: 2,  tilt: 0,  gGlow: false, shake: false },
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

  const wg = ctx.createLinearGradient(originX, cy - 4, originX + dir * 28, cy + 58);
  wg.addColorStop(0,    '#c2410c');
  wg.addColorStop(0.35, '#9a3412');
  wg.addColorStop(0.75, '#7c2d12');
  wg.addColorStop(1,    '#4c1205');

  // Wing main shape — wider, more feathered tip
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.bezierCurveTo(
    originX + dir * 24, originY + 6,
    originX + dir * 30, originY + 34,
    originX + dir * 16, originY + 55
  );
  ctx.bezierCurveTo(
    originX + dir * 10, originY + 42,
    originX + dir * 5,  originY + 22,
    originX, originY
  );
  ctx.closePath();
  ctx.fillStyle = wg;
  ctx.fill();

  // Specular sheen on upper wing
  const wingSpecG = ctx.createRadialGradient(originX + dir * 8, originY + 6, 0, originX + dir * 10, originY + 14, 14);
  wingSpecG.addColorStop(0,   'rgba(220,100,30,0.3)');
  wingSpecG.addColorStop(1,   'transparent');
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.bezierCurveTo(originX + dir * 24, originY + 6, originX + dir * 30, originY + 34, originX + dir * 16, originY + 55);
  ctx.bezierCurveTo(originX + dir * 10, originY + 42, originX + dir * 5, originY + 22, originX, originY);
  ctx.closePath();
  ctx.fillStyle = wingSpecG;
  ctx.fill();

  // Wing edge highlight
  ctx.strokeStyle = 'rgba(210,88,22,0.42)';
  ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(originX, originY + 4);
  ctx.bezierCurveTo(originX + dir * 20, originY + 10, originX + dir * 24, originY + 30, originX + dir * 16, originY + 46);
  ctx.stroke();

  // Feather tip detail lines at bottom
  ctx.strokeStyle = 'rgba(80,18,4,0.5)';
  ctx.lineWidth = 1.2;
  const tipBase = { x: originX + dir * 16, y: originY + 55 };
  [[-4, 0], [0, 2], [4, 0]].forEach(([tdx, tdy]) => {
    ctx.beginPath();
    ctx.moveTo(tipBase.x + dir * tdx, tipBase.y);
    ctx.quadraticCurveTo(tipBase.x + dir * (tdx + 2), tipBase.y + 5 + tdy, tipBase.x + dir * (tdx + 1), tipBase.y + 10 + tdy);
    ctx.stroke();
  });

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
    // Happy sparkle (tiny star-flare on iris rim)
    if (emotion === ORION_EMOTIONS.HAPPY || emotion === ORION_EMOTIONS.CELEBRATING) {
      ctx.fillStyle = 'rgba(255,240,100,0.6)';
      ctx.beginPath();
      ctx.ellipse(px + irisR * 0.6, py - irisR * 0.5, 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Eyelid (closes TOP-DOWN — natural)
  const lidProgress = blink ? 1.0 : (1.0 - eOpen);
  if (lidProgress > 0.02) {
    const lidH = lidProgress * (eyeR * 2.25);
    ctx.beginPath();
    ctx.rect(ex - eyeR - 2, ey - eyeR - 2, (eyeR + 2) * 2, lidH + 2);
    ctx.fillStyle = '#8b3b0a';
    ctx.fill();
    // Sleepy crease line
    if (emotion === ORION_EMOTIONS.SLEEPY) {
      ctx.strokeStyle = '#5c1d07';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - eyeR + 3, ey - eyeR + lidH - 1);
      ctx.lineTo(ex + eyeR - 3, ey - eyeR + lidH - 1);
      ctx.stroke();
    }
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

function drawBeak(ctx, cx, cy) {
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

  // Crease
  ctx.strokeStyle = 'rgba(180,80,0,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx - 5, by + 1); ctx.quadraticCurveTo(bx, by + 8, bx + 5, by + 1); ctx.stroke();
}

function drawCap(ctx, cx, topY) {
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

  // Tassel
  const tx = cx + 22, ty = midY + 7;
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, midY + 1); ctx.quadraticCurveTo(cx + 12, midY + 1, tx, ty); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(tx, ty, 5, 3.5, 0.3, 0, Math.PI * 2); ctx.fillStyle = '#d97706'; ctx.fill();
  [[-4, '#f59e0b'], [0, '#fbbf24'], [4, '#f59e0b']].forEach(([dx, col]) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx + dx, ty + 3);
    ctx.quadraticCurveTo(tx + dx - 1, ty + 11, tx + dx, ty + 14);
    ctx.stroke();
  });
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
  const w = 24, h = 13, r = 5;
  const bx = cx - w / 2;

  // Rounded rect background
  ctx.beginPath();
  ctx.moveTo(bx + r, by); ctx.lineTo(bx + w - r, by);
  ctx.quadraticCurveTo(bx + w, by, bx + w, by + r);
  ctx.lineTo(bx + w, by + h - r);
  ctx.quadraticCurveTo(bx + w, by + h, bx + w - r, by + h);
  ctx.lineTo(bx + r, by + h);
  ctx.quadraticCurveTo(bx, by + h, bx, by + h - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#0ea5e9'; ctx.fill(); ctx.restore();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AI', cx, by + h / 2 + 0.5);
}

function drawBook(ctx, cx, cy) {
  const bx = cx - 26, by = cy + 38, bw = 52, bh = 32;
  // Shadow
  ctx.save(); ctx.globalAlpha = 0.14;
  ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bw, bh, 4); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
  // Cover
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4);
  const cG = ctx.createLinearGradient(bx, by, bx, by + bh);
  cG.addColorStop(0, '#1e3a8a'); cG.addColorStop(1, '#1e40af');
  ctx.fillStyle = cG; ctx.fill();
  // Cover top highlight
  ctx.save(); ctx.globalAlpha = 0.38;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, 5, [4, 4, 0, 0]); ctx.fillStyle = '#6b8dff'; ctx.fill();
  ctx.restore();
  // Pages
  ctx.beginPath(); ctx.roundRect(bx + 3, by + 2, bw - 6, bh - 4, 2); ctx.fillStyle = '#f8fafc'; ctx.fill();
  // Spine
  ctx.beginPath(); ctx.moveTo(cx, by + 2); ctx.lineTo(cx, by + bh - 2);
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5; ctx.stroke();
  // Text lines
  ctx.strokeStyle = '#94a3b8'; ctx.lineCap = 'round';
  [0, 6, 12, 18].forEach(dy => {
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx + 6, by + 9 + dy); ctx.lineTo(bx + 6 + (dy === 6 ? 12 : 16), by + 9 + dy); ctx.stroke();
  });
  [0, 6, 12].forEach(dy => {
    ctx.beginPath(); ctx.moveTo(cx + 4, by + 9 + dy); ctx.lineTo(cx + 4 + (dy === 6 ? 11 : 14), by + 9 + dy); ctx.stroke();
  });
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
  const cpx = cx + 18, cpy = cy + 44;

  // Steam (animated)
  ctx.save();
  ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.3;
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
  contextPath = '',
  size = 140,
}) => {
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const emotionRef   = useRef(emotion);
  const blinkRef     = useRef(false);
  const pupilRef     = useRef({ px: 0, py: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  // Sync emotion ref whenever prop changes
  useEffect(() => { emotionRef.current = emotion; }, [emotion]);

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
    const scale = (W / 120) * dpr; // Uniform scale: both X and Y

    const render = (ts) => {
      const t  = ts / 1000;
      const em = emotionRef.current || ORION_EMOTIONS.IDLE;
      const cfg = EC[em] || DEFAULT_EC;
      const { px: puffX, py: puffY } = pupilRef.current;
      const blink = blinkRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);

      // Body center (internal coords)
      const cx = 60;
      const baseCY = 72;

      // Bounce / shake (disabled if dragged to let him hang)
      const bounceY = (cfg.shake || isDragging)
        ? 0
        : Math.sin(t * cfg.bF * Math.PI * 2) * cfg.bY;
      const shakeX = cfg.shake
        ? Math.sin(t * cfg.bF * Math.PI * 2) * 3
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
        : Math.sin(t * cfg.wF * Math.PI * 2) * cfg.wAmp;
      const rightAngle = isDragging
        ? -Math.sin(t * 12) * 35 
        : (em === ORION_EMOTIONS.WAVING
            ? Math.sin(t * 5 * Math.PI * 2) * 44
            : -Math.sin(t * cfg.wF * Math.PI * 2) * cfg.wAmp);

      // Eyelids close when petting
      const eOpen = isPetting ? 0.05 : cfg.eOpen;

      // Head tilt (confused oscillates)
      const headTilt = em === ORION_EMOTIONS.CONFUSED
        ? Math.sin(t * 1.2) * cfg.tilt
        : cfg.tilt;

      // Eyebrow subtle breathing
      const ebY = cfg.ebY + Math.sin(t * 0.7) * 0.4;

      ctx.save();
      ctx.translate(shakeX, 0);

      // 1. Ground shadow
      drawShadow(ctx, cx, bodyBottom);

      // 2. Left wing (behind body)
      drawWing(ctx, cx, cy, true, leftAngle);

      // 3. Body + face mask
      drawBody(ctx, cx, cy, breathX, breathY);

      // 4. Right wing (in front for waving)
      drawWing(ctx, cx, cy, false, rightAngle);

      // 5. Head group (with tilt)
      const headPivotY = cy - 10;
      ctx.save();
      ctx.translate(cx, headPivotY);
      ctx.rotate(headTilt * Math.PI / 180);
      ctx.translate(-cx, -headPivotY);

      drawEarTufts(ctx, cx, cy);
      drawCap(ctx, cx, cy - 50);
      drawEyebrows(ctx, cx, cy, isPetting ? -2 : ebY, em);
      drawSingleEye(ctx, cx - 18, cy - 17, 15, puffX, puffY, eOpen, em, blink);
      drawSingleEye(ctx, cx + 18, cy - 17, 15, puffX, puffY, eOpen, em, blink);
      drawBeak(ctx, cx, cy);
      drawGlasses(ctx, cx, cy, cfg.gGlow, t);

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
      if (contextPath === '/timer') {
        drawBook(ctx, cx, cy); // Always reading during Pomodoro
      } else if (contextPath === '/dashboard' && em === ORION_EMOTIONS.IDLE) {
        drawClipboard(ctx, cx, cy);
      } else {
        if (em === ORION_EMOTIONS.FOCUSED || em === ORION_EMOTIONS.IDLE_READING) {
          drawBook(ctx, cx, cy);
        }
        if (em === ORION_EMOTIONS.IDLE_COFFEE) drawCoffeeCup(ctx, cx, cy, t);
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
          <HeartParticle key="h1" index={0} />
          <HeartParticle key="h2" index={1} />
          <HeartParticle key="h3" index={2} />
        </>)}
      </AnimatePresence>

      {/* AI thinking spinner */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full"
            style={{ border: '3px solid rgba(14,165,233,0.2)', borderTopColor: '#0ea5e9', boxShadow: '0 0 14px rgba(14,165,233,0.4)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* The canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.28)) drop-shadow(0 4px 8px rgba(0,0,0,0.14))' }}
      />
    </div>
  );
};

export default OrionCharacter;
