// Parallax backgrounds per zone, placeholder until painted layers (ROADMAP §7).
import { GROUND, H, W } from '../data';
import type { Zone } from '../acts';

type Ctx = CanvasRenderingContext2D;
export interface Particle { x: number; y: number; s: number; v: number; ph: number }

function ridge(c: Ctx, off: number, base: number, amp: number, col: string, seed: number) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 10) { const wx = x + off; c.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(wx * 0.005 + seed)) * (0.6 + 0.4 * Math.sin(wx * 0.013 + seed * 2))); }
  c.lineTo(W, H); c.fill();
}
/** mix a #rrggbb colour towards black (f<1) or white (f>1) */
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)));
  return '#' + ch.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
/** x of the i-th repeating prop, scrolling at the given parallax speed */
const rep = (i: number, gap: number, period: number, scroll: number, speed: number) => ((i * gap - scroll * speed) % period + period) % period - 60;

function flower(c: Ctx, x: number, y: number, s: number) {
  c.strokeStyle = '#3a5a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 3); c.stroke();
  c.strokeStyle = '#e2443c'; c.lineWidth = 1.4;
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.45; c.beginPath(); c.moveTo(x, y - s * 3); c.quadraticCurveTo(x + Math.cos(a) * s * 1.6, y - s * 3 + Math.sin(a) * s * 1.2, x + Math.cos(a) * s * 2.2, y - s * 3 + Math.sin(a) * s * 2.4); c.stroke(); }
}
function banner(c: Ctx, x: number, y: number, h: number, col: string, wave: number) {
  c.fillStyle = '#2a2622'; c.fillRect(x, y, 2.5, h);
  c.fillStyle = col; c.beginPath(); c.moveTo(x + 2, y + 4); c.lineTo(x + 18 + wave, y + 6); c.lineTo(x + 17 - wave, y + h * 0.55); c.lineTo(x + 2, y + h * 0.55); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x + 10, y + h * 0.25, 3, 0, 7); c.fill();
}

function prop(c: Ctx, z: Zone, scroll: number, t: number) {
  const dk = shade(z.near, 0.7), mid = shade(z.far, 0.85);
  switch (z.prop) {
    case 'bamboo':
      for (let i = 0; i < 9; i++) { const x = rep(i, 83, 720, scroll, 0.55); c.fillStyle = i % 2 ? '#2f4a35' : '#365640'; c.fillRect(x, 40, 9, GROUND - 40); c.fillStyle = '#22382a'; for (let j = 0; j < 6; j++) c.fillRect(x - 1, 60 + j * 48, 11, 3);
        c.fillStyle = '#3f6a48'; c.beginPath(); c.ellipse(x + 16, 70 + (i % 3) * 40, 14, 3, -0.4, 0, 7); c.fill(); }
      break;
    case 'village':
      for (let i = 0; i < 3; i++) {
        const x = rep(i, 260, 780, scroll, 0.4); c.fillStyle = dk;
        c.fillRect(x, GROUND - 70, 120, 70);
        c.beginPath(); c.moveTo(x - 16, GROUND - 66); c.lineTo(x + 30, GROUND - 120); c.lineTo(x + 90, GROUND - 120); c.lineTo(x + 136, GROUND - 66); c.fill();
        c.fillStyle = shade(z.near, 0.5); c.fillRect(x + 20, GROUND - 50, 22, 50); c.fillRect(x + 70, GROUND - 46, 30, 20);
        const glow = 0.5 + 0.4 * Math.sin(t * 3 + i); c.fillStyle = `rgba(255,190,110,${glow})`; c.beginPath(); c.ellipse(x + 132, GROUND - 58, 6, 9, 0, 0, 7); c.fill();
      }
      break;
    case 'jizo':
      for (let i = 0; i < 14; i++) {
        const x = rep(i, 52, 728, scroll, 0.62), y = GROUND - 2 - (i % 3) * 6, s = 0.8 + (i % 4) * 0.12;
        c.fillStyle = '#6a7a80'; c.beginPath(); c.ellipse(x, y - 14 * s, 8 * s, 14 * s, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x, y - 30 * s, 6 * s, 0, 7); c.fill();
        c.fillStyle = '#b3342c'; c.beginPath(); c.moveTo(x - 7 * s, y - 24 * s); c.lineTo(x + 7 * s, y - 24 * s); c.lineTo(x, y - 14 * s); c.fill();
      }
      for (let i = 0; i < 2; i++) { const x = rep(i, 380, 760, scroll, 0.5); c.fillStyle = '#4a5a60'; c.fillRect(x, GROUND - 60, 8, 60); c.fillRect(x - 10, GROUND - 74, 28, 14); c.beginPath(); c.moveTo(x - 14, GROUND - 74); c.lineTo(x + 4, GROUND - 90); c.lineTo(x + 22, GROUND - 74); c.fill(); c.fillStyle = 'rgba(95,211,224,.7)'; c.fillRect(x - 4, GROUND - 71, 16, 8); }
      break;
    case 'terraces':
      for (let j = 0; j < 5; j++) { const y = 200 + j * 20, off = (scroll * (0.1 + j * 0.04)) % 140;
        c.fillStyle = shade(z.far, 0.9 + j * 0.05); c.fillRect(0, y, W, 20); c.fillStyle = shade(z.far, 1.25);
        for (let x = -off; x < W; x += 140) c.fillRect(x, y, 110, 2); }
      for (let i = 0; i < 2; i++) { const x = rep(i, 330, 660, scroll, 0.5); c.strokeStyle = dk; c.lineWidth = 3; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, GROUND - 70); c.moveTo(x - 22, GROUND - 52); c.lineTo(x + 22, GROUND - 52); c.stroke();
        c.fillStyle = dk; c.beginPath(); c.moveTo(x - 18, GROUND - 70); c.lineTo(x, GROUND - 82); c.lineTo(x + 18, GROUND - 70); c.fill(); }
      break;
    case 'river':
      c.fillStyle = shade(z.far, 1.15); c.fillRect(0, GROUND - 26, W, 16);
      c.fillStyle = 'rgba(255,255,255,.25)'; for (let x = -((scroll * 0.7) % 60); x < W; x += 60) c.fillRect(x, GROUND - 20, 26, 2);
      for (let i = 0; i < 12; i++) flower(c, rep(i, 61, 732, scroll, 0.8), GROUND - 4, 4 + (i % 3));
      break;
    case 'dojo': {
      const x = rep(0, 0, 900, scroll, 0.3) + 200; c.fillStyle = dk;
      c.fillRect(x, GROUND - 90, 12, 90); c.fillRect(x + 150, GROUND - 70, 12, 70); c.fillRect(x + 70, GROUND - 90, 10, 90);
      c.beginPath(); c.moveTo(x - 30, GROUND - 88); c.lineTo(x + 40, GROUND - 140); c.lineTo(x + 140, GROUND - 120); c.lineTo(x + 190, GROUND - 74); c.lineTo(x + 120, GROUND - 92); c.fill();
      c.fillStyle = z.near; c.fillRect(x + 20, GROUND - 70, 44, 6);
      for (let i = 0; i < 8; i++) flower(c, rep(i, 97, 776, scroll, 0.8), GROUND - 2, 4);
      break;
    }
    case 'stairs': {
      for (let i = 0; i < 4; i++) { const x = rep(i, 190, 760, scroll, 0.35); c.fillStyle = shade(z.far, 0.6);
        c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x + 16, 60); c.lineTo(x + 32, GROUND); c.fill(); }
      const x = rep(0, 0, 900, scroll, 0.2) + 120; c.fillStyle = mid;
      for (let j = 0; j < 12; j++) c.fillRect(x + j * 14, GROUND - 30 - j * 12, 180 - j * 10, 4);
      c.fillStyle = '#7a2a3a'; c.fillRect(x + 160, GROUND - 200, 6, 60); c.fillRect(x + 200, GROUND - 200, 6, 60); c.fillRect(x + 150, GROUND - 206, 66, 6);
      break;
    }
    case 'burned':
      for (let i = 0; i < 5; i++) { const x = rep(i, 150, 750, scroll, 0.45), h = 60 + (i * 37) % 80;
        c.fillStyle = '#1a0e14'; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, GROUND - h); c.lineTo(x + 6, GROUND - h - 10); c.lineTo(x + 12, GROUND - h + 4); c.lineTo(x + 12, GROUND); c.fill();
        c.fillStyle = `rgba(255,120,60,${0.3 + 0.3 * Math.sin(t * 4 + i)})`; c.fillRect(x + 2, GROUND - h + 6, 3, 8); }
      c.fillStyle = '#1a0e14'; { const x = rep(0, 0, 800, scroll, 0.3) + 100; c.beginPath(); c.moveTo(x, GROUND - 60); c.lineTo(x + 120, GROUND - 90); c.lineTo(x + 230, GROUND - 40); c.lineTo(x + 200, GROUND - 50); c.lineTo(x + 120, GROUND - 76); c.fill(); }
      break;
    case 'hall': {
      const x = rep(0, 0, 1000, scroll, 0.22) + 160; c.fillStyle = dk;
      c.fillRect(x, GROUND - 110, 240, 110);
      c.beginPath(); c.moveTo(x - 50, GROUND - 104); c.quadraticCurveTo(x + 10, GROUND - 120, x + 40, GROUND - 170); c.lineTo(x + 200, GROUND - 170); c.quadraticCurveTo(x + 230, GROUND - 120, x + 290, GROUND - 104); c.fill();
      for (let j = 0; j < 4; j++) { c.fillStyle = `rgba(255,61,110,${0.25 + 0.15 * Math.sin(t * 2 + j)})`; c.fillRect(x + 22 + j * 56, GROUND - 82, 36, 60); }
      break;
    }
    case 'camp':
      for (let i = 0; i < 2; i++) { const x = rep(i, 400, 800, scroll, 0.4); c.fillStyle = shade(z.near, 1.6);
        c.fillRect(x, GROUND - 60, 180, 44); c.fillStyle = z.near; for (let k = 0; k < 6; k++) c.fillRect(x + k * 30, GROUND - 62, 2, 62);
        c.strokeStyle = z.near; c.lineWidth = 2; c.beginPath(); c.arc(x + 90, GROUND - 38, 12, 0, 7); c.stroke(); }
      for (let i = 0; i < 6; i++) { const x = rep(i, 120, 720, scroll, 0.65); c.strokeStyle = '#2a2622'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x + 18, GROUND - 70); c.stroke(); }
      for (let i = 0; i < 3; i++) banner(c, rep(i, 260, 780, scroll, 0.55), GROUND - 110, 110, '#b3242c', Math.sin(t * 2 + i) * 3);
      break;
    case 'fogfield':
      for (let i = 0; i < 8; i++) { const x = rep(i, 95, 760, scroll, 0.6); c.strokeStyle = '#3a3632'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x - 20 + (i % 3) * 18, GROUND - 60 - (i % 2) * 20); c.stroke(); }
      for (let i = 0; i < 2; i++) { const x = rep(i, 420, 840, scroll, 0.5); c.save(); c.translate(x, GROUND); c.rotate(-0.5); banner(c, 0, -90, 90, '#b3242c', 0); c.restore(); }
      break;
    case 'banners':
      for (let i = 0; i < 10; i++) { const x = rep(i, 76, 760, scroll, 0.4 + (i % 3) * 0.08); banner(c, x, GROUND - 150 + (i % 3) * 22, 140 - (i % 3) * 22, '#b3242c', Math.sin(t * 2.4 + i) * 4); }
      break;
    case 'sulfur':
      for (let i = 0; i < 4; i++) { const x = rep(i, 200, 800, scroll, 0.55);
        c.fillStyle = '#c9b86a'; c.beginPath(); c.ellipse(x, GROUND - 6, 46, 8, 0, 0, 7); c.fill(); c.fillStyle = '#7ab0a0'; c.beginPath(); c.ellipse(x, GROUND - 6, 34, 5, 0, 0, 7); c.fill();
        c.fillStyle = dk; c.beginPath(); c.moveTo(x + 50, GROUND); c.lineTo(x + 62, GROUND - 30); c.lineTo(x + 84, GROUND - 22); c.lineTo(x + 92, GROUND); c.fill(); }
      break;
    case 'ruins': {
      const x = rep(0, 0, 900, scroll, 0.3) + 80; c.fillStyle = mid;
      c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x + 40, GROUND - 120); c.lineTo(x + 220, GROUND - 120); c.lineTo(x + 250, GROUND - 60); c.lineTo(x + 270, GROUND); c.fill();
      c.strokeStyle = shade(z.far, 0.6); c.lineWidth = 1; for (let j = 1; j < 8; j++) { c.beginPath(); c.moveTo(x + 40 - j * 5, GROUND - 120 + j * 15); c.lineTo(x + 240, GROUND - 120 + j * 15); c.stroke(); }
      for (let i = 0; i < 3; i++) { const cx = rep(i, 240, 720, scroll, 0.6); c.fillStyle = '#2a1e14'; c.fillRect(cx, GROUND - 56, 5, 56); c.fillRect(cx - 12, GROUND - 44, 29, 5); }
      break;
    }
    case 'jigoku':
      for (let i = 0; i < 4; i++) { const x = rep(i, 210, 840, scroll, 0.55);
        const g = c.createRadialGradient(x, GROUND - 6, 2, x, GROUND - 6, 50); g.addColorStop(0, '#ff5a2a'); g.addColorStop(1, '#8a1a10');
        c.fillStyle = g; c.beginPath(); c.ellipse(x, GROUND - 6, 52, 9, 0, 0, 7); c.fill();
        c.fillStyle = '#1a0a08'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + 60 + k * 14, GROUND); c.lineTo(x + 66 + k * 14, GROUND - 26 - k * 8); c.lineTo(x + 72 + k * 14, GROUND); c.fill(); } }
      break;
  }
}

export function drawWorld(c: Ctx, z: Zone, scroll: number, parts: Particle[], ink: boolean) {
  const t = performance.now() / 1000;
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, z.sky[0]); g.addColorStop(1, z.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const mg = c.createRadialGradient(420, 110, z.moonR * 0.6, 420, 110, z.moonR * 2); mg.addColorStop(0, z.moon + '55'); mg.addColorStop(1, z.moon + '00');
  c.fillStyle = mg; c.beginPath(); c.arc(420, 110, z.moonR * 2, 0, 7); c.fill();
  c.fillStyle = z.moon; c.beginPath(); c.arc(420, 110, z.moonR, 0, 7); c.fill();
  ridge(c, scroll * 0.08, 230, 100, z.far, 1); prop(c, z, scroll, t); ridge(c, scroll * 0.3, 288, 40, z.near, 4);
  c.fillStyle = z.ground; c.fillRect(0, GROUND, W, H - GROUND);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let x = -(scroll % 48); x < W; x += 48) c.fillRect(x, GROUND + 16, 24, 3);
  c.fillStyle = ink ? 'rgba(20,18,16,.75)' : 'rgba(0,0,0,.25)'; c.fillRect(0, GROUND, W, ink ? 4 : 3);
  for (const p of parts) {
    switch (z.part) {
      case 'petal': c.fillStyle = '#f7c2d0'; c.beginPath(); c.ellipse(p.x, p.y, p.s * 1.7, p.s, p.ph, 0, 7); c.fill(); break;
      case 'redpetal': c.fillStyle = '#e2443c'; c.beginPath(); c.ellipse(p.x, p.y, p.s * 1.9, p.s * 0.7, p.ph, 0, 7); c.fill(); break;
      case 'leaf': c.fillStyle = '#8fb36a'; c.beginPath(); c.ellipse(p.x, p.y, p.s * 2.2, p.s * 0.8, p.ph, 0, 7); c.fill(); break;
      case 'snow': c.fillStyle = '#f2f5fa'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); break;
      case 'ember': c.fillStyle = 'rgba(255,140,70,' + (0.4 + 0.4 * Math.sin(p.ph * 3)) + ')'; c.fillRect(p.x, p.y, p.s, p.s); break;
      case 'ash': c.fillStyle = ink ? 'rgba(30,28,26,.45)' : 'rgba(210,205,215,.55)'; c.fillRect(p.x, p.y, p.s * 1.4, p.s * 0.8); break;
      case 'onibi': {
        const a = 0.35 + 0.35 * Math.sin(p.ph * 2); c.fillStyle = `rgba(95,211,224,${a * 0.3})`; c.beginPath(); c.arc(p.x, p.y, p.s * 4, 0, 7); c.fill();
        c.fillStyle = `rgba(200,250,255,${a})`; c.beginPath(); c.arc(p.x, p.y, p.s * 1.2, 0, 7); c.fill(); break;
      }
      case 'steam': c.fillStyle = 'rgba(240,225,200,.045)'; c.beginPath(); c.arc(p.x, p.y, 10 + p.s * 6, 0, 7); c.fill(); break;
      default: c.fillStyle = ink ? 'rgba(250,248,240,.12)' : 'rgba(200,205,220,.06)'; c.beginPath(); c.arc(p.x, p.y * 0.4 + 190, 30 + p.s * 14, 0, 7); c.fill();
    }
  }
}

export function stepParticles(parts: Particle[], z: Zone, dt: number, moving: boolean) {
  const run = moving ? 70 : 0;
  for (const p of parts) {
    p.ph += dt;
    if (z.part === 'ember' || z.part === 'steam' || z.part === 'onibi') {
      p.y -= p.v * (z.part === 'onibi' ? 14 : 40) * dt; p.x -= (run + (z.part === 'onibi' ? Math.sin(p.ph) * 10 : 10)) * dt;
      if (p.y < 0) { p.y = z.part === 'steam' ? GROUND : H; p.x = Math.random() * W; }
    } else if (z.part === 'fog') p.x -= (p.v * 12 + run * 0.6) * dt;
    else { p.x -= (p.v * 40 + run) * dt; p.y += p.v * (z.part === 'snow' ? 40 : z.part === 'ash' ? 16 : 22) * dt; }
    if (p.x < -40) { p.x = W + 30; p.y = Math.random() * H * 0.7; }
    if (p.y > H) p.y = 0;
  }
}
