// Procedural yokai and act bosses, placeholder until sprites (ROADMAP §7).
// Everything faces left, towards the hero. Origin is the foe's feet on the ground line.
import { GROUND } from '../data';
import { inkColor, type BossKind, type FoeKind } from '../acts';

type Ctx = CanvasRenderingContext2D;
export interface FoeLook { kind: FoeKind; x: number; r: number; col: string; ph: number; hitT: number; stun: number; boss?: string; hp: number; max: number; lift: number }
export interface BossLook { kind: BossKind; x: number; r: number; col: string; ph: number; hitT: number; stun: number; lift: number; phase: number; cast: number }

// act IV draws foes as ink: every fixed colour goes through k()
let ink = false;
export const setInk = (v: boolean) => { ink = v; };
const k = (col: string) => ink ? inkColor(col) : col;

function eyes(c: Ctx, x: number, y: number, r: number, col = '#fff') {
  c.fillStyle = k(col); c.beginPath(); c.arc(x, y, r * 0.12, 0, 7); c.arc(x + r * 0.32, y, r * 0.12, 0, 7); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(x - 1, y, r * 0.05, 0, 7); c.arc(x + r * 0.32 - 1, y, r * 0.05, 0, 7); c.fill();
}
function skullHead(c: Ctx, x: number, y: number, s: number, bone: string, glow: string) {
  c.fillStyle = k(bone); c.beginPath(); c.arc(x, y, s, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(x + s * 0.55, y + s * 0.9); c.lineTo(x - s * 0.55, y + s * 0.9); c.fill();
  c.fillStyle = '#14121a'; c.beginPath(); c.ellipse(x - s * 0.38, y + s * 0.05, s * 0.26, s * 0.3, 0, 0, 7); c.ellipse(x + s * 0.3, y + s * 0.05, s * 0.24, s * 0.3, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(x - s * 0.05, y + s * 0.35); c.lineTo(x - s * 0.15, y + s * 0.55); c.lineTo(x + s * 0.05, y + s * 0.55); c.fill();
  c.fillStyle = k(glow); c.beginPath(); c.arc(x - s * 0.38, y + s * 0.08, s * 0.08, 0, 7); c.arc(x + s * 0.3, y + s * 0.08, s * 0.08, 0, 7); c.fill();
  c.strokeStyle = '#14121a'; c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * s * 0.18, y + s * 0.68); c.lineTo(x + i * s * 0.18, y + s * 0.9); c.stroke(); }
}
function flame(c: Ctx, x: number, y: number, w: number, h: number, ph: number, outer: string, inner: string) {
  const g = c.createLinearGradient(0, y, 0, y - h); g.addColorStop(0, k(inner)); g.addColorStop(1, k(outer) + '00');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - w, y);
  c.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + Math.sin(ph * 3) * w * 0.4, y - h);
  c.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y); c.fill();
}

export function drawFoe(c: Ctx, e: FoeLook) {
  const r = e.r, kd = e.kind, hover = kd === 'yurei' ? Math.sin(e.ph) * 4 - 8 : 0, bob = Math.sin(e.ph) * 1.5, col = e.col;
  c.save(); c.translate(e.x, GROUND + bob + hover - e.lift); if (e.hitT > 0) c.globalAlpha = 0.6;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, -hover + e.lift, r * 0.9 * (e.lift ? 0.6 : 1), r * 0.18, 0, 0, 7); c.fill();
  if (kd === 'kappa') {
    c.fillStyle = k('#6b4a2e'); c.beginPath(); c.ellipse(-r * 0.45, -r, r * 0.6, r * 0.8, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * 0.95, r * 0.75, r * 0.9, 0, 0, 7); c.fill();
    c.fillStyle = k('#d9d58f'); c.beginPath(); c.ellipse(-r * 0.05, -r * 1.78, r * 0.45, r * 0.14, 0, 0, 7); c.fill();
    c.fillStyle = k('#2a3a22'); c.beginPath(); c.moveTo(-r * 0.55, -r * 1.7);
    for (let i = 0; i < 6; i++) c.lineTo(-r * 0.55 + i * r * 0.22, -r * 1.62 + (i % 2) * r * 0.18);
    c.lineTo(r * 0.6, -r * 1.6); c.fill();
    c.fillStyle = k('#d9b545'); c.beginPath(); c.moveTo(-r * 0.6, -r * 1.1); c.lineTo(-r * 1.0, -r * 1.0); c.lineTo(-r * 0.6, -r * 0.9); c.fill();
    eyes(c, -r * 0.35, -r * 1.3, r);
  } else if (kd === 'tanuki') {
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r, r, r, 0, 0, 7); c.fill();
    c.fillStyle = k('#d8c19e'); c.beginPath(); c.ellipse(-r * 0.1, -r * 0.8, r * 0.6, r * 0.65, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(-r * 0.1, -r * 1.95, r * 0.55, 0, 7); c.fill();
    c.beginPath(); c.arc(-r * 0.5, -r * 2.4, r * 0.18, 0, 7); c.arc(r * 0.3, -r * 2.4, r * 0.18, 0, 7); c.fill();
    c.fillStyle = k('#2a2018'); c.beginPath(); c.ellipse(-r * 0.32, -r * 1.95, r * 0.22, r * 0.14, 0, 0, 7); c.ellipse(r * 0.12, -r * 1.95, r * 0.22, r * 0.14, 0, 0, 7); c.fill();
    c.fillStyle = k('#8c6f45'); c.beginPath(); c.moveTo(-r * 1.0, -r * 2.25); c.lineTo(-r * 0.1, -r * 2.85); c.lineTo(r * 0.8, -r * 2.25); c.fill();
    c.fillStyle = '#fff'; c.fillRect(-r * 0.36, -r * 1.98, 2, 2); c.fillRect(r * 0.06, -r * 1.98, 2, 2);
  } else if (kd === 'oni') {
    c.save(); c.translate(-r * 0.7, -r * 1.1); c.rotate(-0.5 + Math.sin(e.ph * 1.5) * 0.3);
    c.fillStyle = k('#3a3030'); c.fillRect(-4, -r * 1.6, 8, r * 1.6); c.fillStyle = k('#6a6060'); for (let i = 0; i < 4; i++) c.fillRect(-6, -r * 1.5 + i * r * 0.32, 12, 3); c.restore();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * 1.05, r * 0.85, r * 1.05, 0, 0, 7); c.fill();
    c.fillStyle = k('#e6b450'); c.fillRect(-r * 0.85, -r * 0.55, r * 1.7, r * 0.45); c.fillStyle = k('#2a2020'); for (let i = 0; i < 4; i++) c.fillRect(-r * 0.7 + i * r * 0.42, -r * 0.55, r * 0.12, r * 0.45);
    c.fillStyle = k('#2a1a1a'); c.beginPath(); c.arc(0, -r * 1.85, r * 0.5, Math.PI, 0); c.fill();
    c.fillStyle = k('#efe7d4'); c.beginPath(); c.moveTo(-r * 0.45, -r * 1.95); c.lineTo(-r * 0.35, -r * 2.6); c.lineTo(-r * 0.18, -r * 2.0); c.fill();
    c.beginPath(); c.moveTo(r * 0.18, -r * 2.0); c.lineTo(r * 0.35, -r * 2.6); c.lineTo(r * 0.45, -r * 1.95); c.fill();
    eyes(c, -r * 0.25, -r * 1.5, r, '#ffd36a');
    c.fillStyle = k('#efe7d4'); c.fillRect(-r * 0.35, -r * 1.2, r * 0.12, r * 0.18); c.fillRect(r * 0.05, -r * 1.2, r * 0.12, r * 0.18);
  } else if (kd === 'tengu') {
    c.fillStyle = k('#1d1f2c'); c.beginPath(); c.moveTo(r * 0.2, -r * 1.5); c.quadraticCurveTo(r * 1.4, -r * 2.4 + Math.sin(e.ph * 2) * r * 0.3, r * 1.1, -r * 0.6); c.fill();
    c.fillStyle = k('#e6dec9'); c.beginPath(); c.moveTo(-r * 0.7, -r * 1.5); c.lineTo(r * 0.7, -r * 1.5); c.lineTo(r * 0.9, 0); c.lineTo(-r * 0.9, 0); c.fill();
    c.fillStyle = k('#2c3762'); c.fillRect(-r * 0.7, -r * 0.5, r * 1.4, r * 0.5);
    c.fillStyle = col; c.beginPath(); c.arc(0, -r * 1.9, r * 0.5, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-r * 0.3, -r * 1.95); c.lineTo(-r * 1.3, -r * 1.85); c.lineTo(-r * 0.3, -r * 1.75); c.fill();
    c.fillStyle = k('#1a1a24'); c.fillRect(-r * 0.35, -r * 2.5, r * 0.7, r * 0.2); c.fillRect(-r * 0.1, -r * 2.65, r * 0.2, r * 0.2);
    eyes(c, -r * 0.2, -r * 2.05, r * 0.8);
  } else if (kd === 'skull') {
    // gashadokuro head trailing turquoise fire
    flame(c, r * 0.3, -r * 0.9, r * 0.8, r * 1.8, e.ph, '#5fd3e0', '#2a8a9a');
    c.save(); c.translate(0, -r * 1.2); c.rotate(-Math.PI / 2 - 0.2); flame(c, 0, 0, r * 0.7, r * 2.2, e.ph * 1.3, '#5fd3e0', '#5fd3e0'); c.restore();
    skullHead(c, 0, -r * 1.4, r * 0.85, col, '#7fe9f0');
  } else if (kd === 'onibi') {
    const g = c.createRadialGradient(0, -r * 1.1, 1, 0, -r * 1.1, r * 1.6); g.addColorStop(0, k(col) + 'aa'); g.addColorStop(1, k(col) + '00');
    c.fillStyle = g; c.beginPath(); c.arc(0, -r * 1.1, r * 1.6, 0, 7); c.fill();
    flame(c, 0, -r * 0.4, r * 0.75, r * 2.1, e.ph, col, '#e8fbff');
    c.fillStyle = k('#e8fbff'); c.beginPath(); c.arc(0, -r * 0.85, r * 0.45, 0, 7); c.fill();
    c.fillStyle = k('#16303a'); c.beginPath(); c.arc(-r * 0.2, -r * 0.95, r * 0.08, 0, 7); c.arc(r * 0.12, -r * 0.95, r * 0.08, 0, 7); c.fill();
  } else if (kd === 'ashigaru') {
    // skeleton foot soldier: jingasa hat, rusty do, yari pointed at the hero
    const step = Math.sin(e.ph * 1.6) * r * 0.12;
    c.strokeStyle = k(col); c.lineWidth = r * 0.14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-r * 0.15, -r * 0.9); c.lineTo(-r * 0.3 + step, 0); c.moveTo(r * 0.15, -r * 0.9); c.lineTo(r * 0.3 - step, 0); c.stroke();
    c.strokeStyle = k('#4a3a2a'); c.lineWidth = 3; c.beginPath(); c.moveTo(-r * 2.1, -r * 1.45); c.lineTo(r * 0.9, -r * 1.2); c.stroke();
    c.fillStyle = k('#c8ccd8'); c.beginPath(); c.moveTo(-r * 2.5, -r * 1.48); c.lineTo(-r * 2.05, -r * 1.55); c.lineTo(-r * 2.05, -r * 1.37); c.fill();
    c.fillStyle = k('#6a3a2a'); c.beginPath(); c.moveTo(-r * 0.55, -r * 1.75); c.lineTo(r * 0.55, -r * 1.75); c.lineTo(r * 0.65, -r * 0.8); c.lineTo(-r * 0.65, -r * 0.8); c.fill();
    c.fillStyle = k('#3a2018'); for (let i = 0; i < 3; i++) c.fillRect(-r * 0.6, -r * 1.55 + i * r * 0.28, r * 1.2, r * 0.06);
    c.strokeStyle = k(col); c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(-r * 0.4, -r * 1.6); c.lineTo(-r * 0.9, -r * 1.35); c.stroke();
    skullHead(c, -r * 0.05, -r * 2.15, r * 0.42, col, '#7fe9f0');
    c.fillStyle = k('#2a2420'); c.beginPath(); c.moveTo(-r * 0.85, -r * 2.25); c.lineTo(0, -r * 2.75); c.lineTo(r * 0.85, -r * 2.25); c.quadraticCurveTo(0, -r * 2.35, -r * 0.85, -r * 2.25); c.fill();
  } else if (kd === 'monk') {
    // sohei ghost: white hood, charred robe, naginata
    c.strokeStyle = k('#3a2a20'); c.lineWidth = 3; c.beginPath(); c.moveTo(-r * 1.6, -r * 2.6); c.lineTo(r * 0.6, -r * 0.4); c.stroke();
    c.fillStyle = k('#c8ccd8'); c.beginPath(); c.moveTo(-r * 1.6, -r * 2.6); c.quadraticCurveTo(-r * 2.1, -r * 3.0, -r * 2.0, -r * 3.3); c.lineTo(-r * 1.45, -r * 2.75); c.fill();
    c.fillStyle = k('#2a2026'); c.beginPath(); c.moveTo(-r * 0.75, -r * 1.9); c.lineTo(r * 0.75, -r * 1.9); c.lineTo(r, 0); c.lineTo(-r, 0); c.fill();
    c.fillStyle = k('#ff8a3c'); for (let i = 0; i < 4; i++) { const a = 0.5 + 0.5 * Math.sin(e.ph * 2 + i); c.globalAlpha = a; c.fillRect(-r * 0.6 + i * r * 0.38, -r * 0.3 - (i % 2) * r * 0.5, 2, 2); }
    c.globalAlpha = e.hitT > 0 ? 0.6 : 1;
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * 2.25, r * 0.6, r * 0.62, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-r * 0.6, -r * 2.1); c.lineTo(r * 0.9, -r * 1.2); c.lineTo(r * 0.6, -r * 2.2); c.fill();
    c.fillStyle = '#14121a'; c.fillRect(-r * 0.5, -r * 2.35, r * 0.75, r * 0.2);
    c.fillStyle = k('#e2566c'); c.fillRect(-r * 0.4, -r * 2.3, r * 0.12, r * 0.08); c.fillRect(-r * 0.12, -r * 2.3, r * 0.12, r * 0.08);
  } else if (kd === 'crow') {
    const flap = Math.sin(e.ph * 4) * r * 0.9;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-r * 0.2, -r * 1.2); c.quadraticCurveTo(r * 0.4, -r * 1.2 - flap, r * 1.3, -r * 1.3 - flap * 0.7); c.lineTo(r * 0.5, -r * 1.0); c.fill();
    c.beginPath(); c.ellipse(0, -r * 1.05, r * 0.85, r * 0.42, 0.1, 0, 7); c.fill();
    c.beginPath(); c.moveTo(r * 0.7, -r * 1.1); c.lineTo(r * 1.4, -r * 1.3); c.lineTo(r * 1.35, -r * 0.8); c.fill();
    c.beginPath(); c.arc(-r * 0.8, -r * 1.25, r * 0.35, 0, 7); c.fill();
    c.fillStyle = k('#3a3a44'); c.beginPath(); c.moveTo(-r * 1.1, -r * 1.3); c.lineTo(-r * 1.6, -r * 1.15); c.lineTo(-r * 1.08, -r * 1.12); c.fill();
    c.fillStyle = k('#e2566c'); c.beginPath(); c.arc(-r * 0.88, -r * 1.32, r * 0.08, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(-r * 0.1, -r * 1.05); c.quadraticCurveTo(r * 0.2, -r * 1.0 + flap, -r * 0.9, -r * 0.6 + flap * 0.6); c.lineTo(r * 0.3, -r * 0.85); c.fill();
  } else if (kd === 'wheel') {
    // wanyudo: burning ox-cart wheel with a face in the hub
    const cy = -r * 1.05;
    flame(c, r * 0.3, cy + r * 0.6, r * 1.1, r * 2.4, e.ph, '#ff8a3c', '#ffd36a');
    c.save(); c.translate(0, cy); c.rotate(-e.ph * 2);
    c.strokeStyle = k('#3a2418'); c.lineWidth = r * 0.18; c.beginPath(); c.arc(0, 0, r * 0.95, 0, 7); c.stroke();
    c.lineWidth = r * 0.08; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4); c.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); c.stroke(); }
    c.restore();
    c.fillStyle = k('#c4544e'); c.beginPath(); c.arc(0, cy, r * 0.5, 0, 7); c.fill();
    c.fillStyle = k('#1a1010'); c.beginPath(); c.moveTo(-r * 0.32, cy - r * 0.12); c.lineTo(-r * 0.08, cy - r * 0.02); c.lineTo(-r * 0.3, cy + r * 0.02); c.fill();
    c.beginPath(); c.moveTo(r * 0.28, cy - r * 0.12); c.lineTo(r * 0.06, cy - r * 0.02); c.lineTo(r * 0.28, cy + r * 0.02); c.fill();
    c.fillRect(-r * 0.22, cy + r * 0.2, r * 0.44, r * 0.1);
  } else if (kd === 'hand') {
    // pale hand clawing out of the floor
    const rise = Math.min(1, 0.6 + 0.4 * Math.sin(e.ph * 0.8));
    c.fillStyle = k('#2a1a1e'); c.beginPath(); c.ellipse(0, 0, r * 0.9, r * 0.22, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(-r * 0.32, 0); c.lineTo(-r * 0.4, -r * 1.6 * rise); c.lineTo(r * 0.4, -r * 1.6 * rise); c.lineTo(r * 0.32, 0); c.fill();
    c.beginPath(); c.ellipse(0, -r * 1.8 * rise, r * 0.55, r * 0.4, 0, 0, 7); c.fill();
    c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = r * 0.2;
    for (let i = 0; i < 4; i++) { const fx = -r * 0.42 + i * r * 0.28, curl = Math.sin(e.ph * 2 + i) * r * 0.15;
      c.beginPath(); c.moveTo(fx, -r * 2.0 * rise); c.lineTo(fx - r * 0.12 + curl, -r * 2.7 * rise); c.lineTo(fx - r * 0.35, -r * 2.85 * rise); c.stroke(); }
    c.beginPath(); c.moveTo(r * 0.5, -r * 1.8 * rise); c.lineTo(r * 0.85, -r * 2.25 * rise); c.stroke();
    c.strokeStyle = k('#3a6a70'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r * 0.1, -r * 0.3); c.lineTo(0, -r * 1.2 * rise); c.lineTo(-r * 0.15, -r * 1.7 * rise); c.stroke();
  } else {
    c.globalAlpha = e.hitT > 0 ? 0.5 : 0.85;
    const g = c.createLinearGradient(0, -r * 2.2, 0, 0); g.addColorStop(0, col); g.addColorStop(1, col + '00');
    c.fillStyle = g; c.beginPath(); c.moveTo(-r * 0.7, -r * 1.5); c.quadraticCurveTo(-r * 0.9, -r * 0.3, -r * 0.3 + Math.sin(e.ph) * 4, 0); c.lineTo(r * 0.5, 0); c.quadraticCurveTo(r * 0.9, -r * 0.6, r * 0.7, -r * 1.5); c.fill();
    c.fillStyle = k('#f2efe8'); c.beginPath(); c.arc(0, -r * 1.75, r * 0.5, 0, 7); c.fill();
    c.fillStyle = '#14141c'; c.beginPath(); c.moveTo(-r * 0.55, -r * 1.9); c.quadraticCurveTo(-r * 0.2, -r * 2.5, r * 0.55, -r * 1.9); c.lineTo(r * 0.7, -r * 0.9); c.lineTo(r * 0.35, -r * 1.6); c.lineTo(-r * 0.25, -r * 1.85); c.lineTo(-r * 0.6, -r * 1.0); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-r * 0.3, -r * 2.2); c.lineTo(0, -r * 2.45); c.lineTo(r * 0.3, -r * 2.2); c.fill();
    c.fillStyle = k('#4a6a9a'); c.fillRect(-r * 0.3, -r * 1.75, r * 0.15, r * 0.06);
  }
  c.globalAlpha = 1;
  if (e.stun > 0) { c.fillStyle = '#e3b456'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('✶ ✶', 0, -r * 2.8); }
  if (!e.boss) { const bw = r * 1.8; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-bw / 2, -r * 2.75 - hover, bw, 4); c.fillStyle = '#e2566c'; c.fillRect(-bw / 2, -r * 2.75 - hover, bw * Math.max(0, e.hp / e.max), 4); }
  c.restore();
}

/* act bosses, after the references in docs/refs */

function robe(c: Ctx, w: number, top: number, col: string, sway: number) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-w * 0.5, top); c.lineTo(w * 0.5, top);
  c.quadraticCurveTo(w * 0.75, top * 0.4, w * 0.85 + sway, 0); c.lineTo(-w * 0.85 + sway, 0); c.quadraticCurveTo(-w * 0.75, top * 0.4, -w * 0.5, top); c.fill();
}

export function drawBoss(c: Ctx, b: BossLook) {
  const r = b.r, t = b.ph, sway = Math.sin(t * 0.8) * 3;
  c.save(); c.translate(b.x, GROUND - b.lift + Math.sin(t) * (b.lift ? 4 : 1));
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, b.lift, r * 1.1, r * 0.2, 0, 0, 7); c.fill();
  if (b.hitT > 0) c.globalAlpha = 0.7;

  if (b.kind === 'necro') {
    // Kuroyama Seigen: indigo robe, white haori, long grey hair, turquoise smoke and skulls
    if (b.phase) { c.globalAlpha = 0.5; for (let i = 0; i < 5; i++) { c.fillStyle = '#3fb8c4'; c.beginPath(); c.arc(Math.sin(t + i * 1.3) * r * 0.8, -r * (0.4 + i * 0.6), r * (0.5 + 0.15 * Math.sin(t * 2 + i)), 0, 7); c.fill(); } c.globalAlpha = 1; }
    c.fillStyle = '#3a4a5e'; c.beginPath(); c.moveTo(-r * 0.4, -r * 2.75); c.quadraticCurveTo(r * 0.9, -r * 2.4, r * 0.75 + sway, -r * 1.2); c.lineTo(r * 0.2, -r * 2.2); c.fill();
    robe(c, r * 1.1, -r * 2.2, '#24384e', sway);
    c.fillStyle = '#e8e4da'; c.beginPath(); c.moveTo(-r * 0.6, -r * 2.25); c.lineTo(-r * 1.0 + sway, -r * 0.3); c.lineTo(-r * 0.5, -r * 0.5); c.lineTo(-r * 0.2, -r * 2.1); c.fill();
    c.beginPath(); c.moveTo(r * 0.6, -r * 2.25); c.lineTo(r * 1.05 + sway, -r * 0.45); c.lineTo(r * 0.45, -r * 0.6); c.lineTo(r * 0.2, -r * 2.1); c.fill();
    c.fillStyle = '#4a4e58'; c.fillRect(-r * 0.55, -r * 1.35, r * 1.1, r * 0.18);
    c.strokeStyle = '#c4443c'; c.lineWidth = 2; c.beginPath(); c.arc(-r * 0.75, -r * 1.25, r * 0.12, 0, 7); c.stroke();
    c.fillStyle = '#6a6aa0'; c.beginPath(); c.ellipse(-r * 0.05, -r * 2.5, r * 0.3, r * 0.36, 0, 0, 7); c.fill();
    c.fillStyle = '#5a5e6a'; c.beginPath(); c.moveTo(-r * 0.4, -r * 2.55); c.quadraticCurveTo(0, -r * 3.15, r * 0.4, -r * 2.55); c.quadraticCurveTo(r * 0.7, -r * 1.8, r * 0.55 + sway, -r * 1.6); c.lineTo(r * 0.2, -r * 2.4); c.fill();
    c.fillStyle = '#ffd36a'; c.fillRect(-r * 0.22, -r * 2.52, r * 0.1, r * 0.05); c.fillRect(-r * 0.02, -r * 2.52, r * 0.1, r * 0.05);
    for (let i = 0; i < 3; i++) { const a = t * 0.9 + i * 2.1; skullHead(c, Math.cos(a) * r * 1.2, -r * 2.2 + Math.sin(a) * r * 0.5, r * 0.22, '#e9e4d6', '#5fd3e0'); }
  } else if (b.kind === 'faceless') {
    // faceless sword master: black wiry body, red eye, red spider lily halo
    c.strokeStyle = '#e2566c'; c.lineWidth = 2; c.globalAlpha = 0.6;
    for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(0, -r * 2.7, r * 0.3 * i + Math.sin(t * 2) * 2, 0, 7); c.stroke(); }
    c.globalAlpha = b.hitT > 0 ? 0.7 : 1;
    c.strokeStyle = '#141216'; c.lineWidth = r * 0.12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-r * 0.15, -r * 0.6); c.lineTo(-r * 0.25, 0); c.moveTo(r * 0.15, -r * 0.6); c.lineTo(r * 0.3, 0); c.stroke();
    c.fillStyle = '#1a1a1e'; c.beginPath(); c.moveTo(-r * 0.45, -r * 1.45); c.lineTo(r * 0.45, -r * 1.45); c.quadraticCurveTo(r * 0.9, -r * 0.7, r * 0.5 + sway, -r * 0.45); c.lineTo(-r * 0.5 + sway, -r * 0.45); c.quadraticCurveTo(-r * 0.9, -r * 0.7, -r * 0.45, -r * 1.45); c.fill();
    c.fillStyle = '#d8ccb0'; c.fillRect(-r * 0.5, -r * 1.5, r * 1.0, r * 0.14);
    c.beginPath(); c.moveTo(r * 0.3, -r * 1.42); c.lineTo(r * 0.7 + sway * 2, -r * 0.8); c.lineTo(r * 0.5, -r * 1.42); c.fill();
    c.fillStyle = '#141216'; c.beginPath(); c.moveTo(-r * 0.4, -r * 2.25); c.lineTo(r * 0.4, -r * 2.25); c.lineTo(r * 0.3, -r * 1.5); c.lineTo(-r * 0.3, -r * 1.5); c.fill();
    c.strokeStyle = '#6a5a4a'; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * 0.2, -r * 2.1); c.quadraticCurveTo(0, -r * 1.8, r * 0.15, -r * 2.15); c.moveTo(0, -r * 1.95); c.lineTo(0, -r * 1.6); c.stroke();
    c.fillStyle = '#141216'; c.beginPath(); c.ellipse(0, -r * 2.62, r * 0.25, r * 0.36, 0, 0, 7); c.fill();
    c.fillStyle = '#e2566c'; c.beginPath(); c.arc(-r * 0.03, -r * 2.68, r * 0.09, 0, 7); c.fill(); c.fillStyle = '#ffd0d0'; c.beginPath(); c.arc(-r * 0.03, -r * 2.68, r * 0.03, 0, 7); c.fill();
    const draw = b.cast > 0 ? -0.1 : -0.35 + Math.sin(t) * 0.05;
    c.save(); c.translate(-r * 0.45, -r * 1.95); c.rotate(draw);
    c.strokeStyle = '#141216'; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(r * 0.45, r * 0.1); c.lineTo(0, 0); c.stroke();
    c.fillStyle = '#2a2420'; c.fillRect(-r * 0.4, -3, r * 0.4, 6); c.fillStyle = '#d8dce6'; c.beginPath(); c.moveTo(-r * 0.4, -2.5); c.lineTo(-r * 2.2, -1); c.lineTo(-r * 2.3, 1.5); c.lineTo(-r * 0.4, 2.5); c.fill();
    c.restore();
  } else if (b.kind === 'kaisen') {
    // thousand-armed abbot: pale robe, ring of arms, turquoise flame from the head
    c.strokeStyle = '#ff3d6e'; c.lineWidth = 2; c.setLineDash([3, 4]); c.beginPath(); c.arc(0, -r * 1.9, r * 1.35, 0, 7); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#e8dccb'; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, j = Math.floor(i / 2), a = side * (0.4 + j * 0.35) + Math.sin(t * 1.5 + i) * 0.12;
      const ex = Math.sin(a) * r * 1.3, ey = -r * 1.9 - Math.cos(a) * r * 0.9 + j * r * 0.25;
      c.lineWidth = r * 0.13; c.beginPath(); c.moveTo(side * r * 0.3, -r * 2.0 + j * r * 0.18); c.quadraticCurveTo(side * r * 0.8, -r * 2.1 + j * r * 0.3, ex, ey); c.stroke();
      c.fillStyle = '#e8dccb'; c.beginPath(); c.arc(ex, ey, r * 0.1, 0, 7); c.fill();
    }
    robe(c, r * 1.0, -r * 2.15, '#e8dccb', sway * 0.5);
    c.fillStyle = '#2a1426'; c.beginPath(); c.moveTo(-r * 0.15, -r * 2.15); c.lineTo(r * 0.35, -r * 2.15); c.lineTo(r * 0.2, -r * 1.2); c.lineTo(-r * 0.05, -r * 1.4); c.fill();
    c.strokeStyle = '#5fd3e0'; c.lineWidth = 1; c.beginPath(); c.moveTo(r * 0.05, -r * 2.1); c.lineTo(r * 0.1, -r * 1.7); c.lineTo(r * 0.2, -r * 1.5); c.stroke();
    c.fillStyle = '#d8ccb8'; c.fillRect(-r * 0.5, -r * 1.25, r * 1.0, r * 0.16);
    c.fillStyle = '#e8dccb'; c.beginPath(); c.ellipse(0, -r * 2.45, r * 0.24, r * 0.32, 0, 0, 7); c.fill();
    c.fillStyle = '#e2566c'; c.fillRect(-r * 0.14, -r * 2.5, r * 0.08, r * 0.05); c.fillRect(r * 0.04, -r * 2.5, r * 0.08, r * 0.05);
    c.fillStyle = '#2a1426'; c.fillRect(-r * 0.1, -r * 2.32, r * 0.2, r * 0.05);
    flame(c, 0, -r * 2.65, r * 0.25, r * (1.4 + (b.cast > 0 ? 0.8 : 0)), t, '#bfeef0', '#5fd3e0');
    c.strokeStyle = '#e8dccb'; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * 0.7, -r * 3.6); c.lineTo(r * 0.7, -r * 3.6); c.stroke();
  } else if (b.kind === 'shura') {
    // Shura: white tattered haori, black hair mane, bandages, bloody katana, oni mask in phase 2
    c.fillStyle = '#18161a'; c.beginPath(); c.moveTo(-r * 0.3, -r * 2.8);
    for (let i = 0; i <= 8; i++) c.lineTo(r * (0.2 + i * 0.12) + Math.sin(t * 2 + i) * 4, -r * (2.7 - i * 0.2) + (i % 2) * r * 0.2);
    c.lineTo(r * 0.2, -r * 1.6); c.fill();
    c.strokeStyle = '#d8d4c8'; c.lineWidth = r * 0.14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-r * 0.2, -r * 0.8); c.lineTo(-r * 0.45, -r * 0.4); c.lineTo(-r * 0.3, 0); c.moveTo(r * 0.15, -r * 0.8); c.lineTo(r * 0.35, 0); c.stroke();
    c.strokeStyle = '#8a8478'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-r * 0.5, -r * 0.5 + i * 6); c.lineTo(-r * 0.25, -r * 0.45 + i * 6); c.stroke(); }
    c.fillStyle = '#e8e2d4'; c.beginPath(); c.moveTo(-r * 0.6, -r * 2.15); c.lineTo(r * 0.6, -r * 2.15); c.lineTo(r * 0.95 + sway, -r * 0.5);
    for (let i = 0; i < 6; i++) c.lineTo(r * (0.8 - i * 0.3) + sway, -r * (0.75 - (i % 2) * 0.25));
    c.lineTo(-r * 0.95 + sway, -r * 0.6); c.fill();
    c.fillStyle = '#18161a'; c.beginPath(); c.moveTo(-r * 0.1, -r * 2.15); c.lineTo(r * 0.3, -r * 2.15); c.lineTo(r * 0.15, -r * 0.8); c.lineTo(-r * 0.25, -r * 0.8); c.fill();
    c.fillStyle = '#b3242c'; c.fillRect(-r * 0.2, -r * 1.05, r * 0.45, r * 0.5); c.fillRect(r * 0.5, -r * 1.6, r * 0.2, r * 0.25);
    c.fillStyle = '#3a4a6a'; c.fillRect(-r * 0.55, -r * 1.42, r * 1.1, r * 0.13);
    c.fillStyle = '#d8d4c8'; c.beginPath(); c.ellipse(-r * 0.05, -r * 2.45, r * 0.25, r * 0.32, 0, 0, 7); c.fill();
    if (b.phase) { c.fillStyle = '#b3242c'; c.beginPath(); c.ellipse(-r * 0.08, -r * 2.45, r * 0.27, r * 0.33, 0, 0, 7); c.fill();
      c.fillStyle = '#efe7d4'; c.beginPath(); c.moveTo(-r * 0.25, -r * 2.7); c.lineTo(-r * 0.2, -r * 3.0); c.lineTo(-r * 0.1, -r * 2.72); c.moveTo(r * 0.05, -r * 2.72); c.lineTo(r * 0.12, -r * 3.0); c.lineTo(r * 0.15, -r * 2.7); c.fill();
      c.fillStyle = '#ffd36a'; c.fillRect(-r * 0.24, -r * 2.52, r * 0.1, r * 0.06); c.fillRect(-r * 0.02, -r * 2.52, r * 0.1, r * 0.06);
      c.fillStyle = '#efe7d4'; c.fillRect(-r * 0.2, -r * 2.3, r * 0.26, r * 0.06);
    } else {
      c.fillStyle = '#b3242c'; c.beginPath(); c.arc(-r * 0.08, -r * 2.62, r * 0.04, 0, 7); c.fill();
      c.fillStyle = '#18161a'; c.fillRect(-r * 0.22, -r * 2.5, r * 0.08, r * 0.04); c.fillRect(-r * 0.02, -r * 2.5, r * 0.08, r * 0.04);
      c.fillStyle = '#b3242c'; c.beginPath(); c.arc(r * 0.45, -r * 1.2, r * 0.13, 0, 7); c.fill();
    }
    c.fillStyle = '#18161a'; c.beginPath(); c.moveTo(-r * 0.32, -r * 2.5); c.quadraticCurveTo(-r * 0.1, -r * 3.0, r * 0.3, -r * 2.6); c.lineTo(r * 0.2, -r * 2.3); c.fill();
    c.save(); c.translate(-r * 0.6, -r * 1.3); c.rotate(-0.15 + Math.sin(t * (1 + b.cast)) * 0.1);
    c.fillStyle = '#2a2420'; c.fillRect(0, -3, r * 0.4, 6); c.fillStyle = '#c8ccd8'; c.beginPath(); c.moveTo(0, -2.5); c.lineTo(-r * 1.8, 0); c.lineTo(0, 2.5); c.fill();
    c.fillStyle = '#b3242c'; c.fillRect(-r * 1.4, -1.5, r * 0.5, 3); c.fillRect(-r * 0.8, -1, r * 0.2, 2);
    c.restore();
  } else {
    // Reaper of Unzen: black hood, gold armour, black wings, great sword, red scroll orbiting
    const wing = Math.sin(t * (b.lift ? 3 : 1)) * r * 0.25;
    c.fillStyle = '#121014';
    for (const s of [1, 0.75]) { c.beginPath(); c.moveTo(r * 0.2, -r * 2.1); c.quadraticCurveTo(r * 1.5 * s, -r * 3.0 - wing, r * 1.9 * s, -r * 2.2 - wing); c.lineTo(r * 1.3 * s, -r * 1.8); c.lineTo(r * 1.6 * s, -r * 1.4); c.lineTo(r * 0.9 * s, -r * 1.3); c.fill(); }
    c.beginPath(); c.moveTo(-r * 0.55, -r * 2.2); c.lineTo(r * 0.55, -r * 2.2);
    for (let i = 0; i <= 6; i++) c.lineTo(r * (0.8 - i * 0.27) + sway, -(i % 2) * r * 0.25 + (b.lift ? 0 : 0));
    c.lineTo(-r * 0.75 + sway, -r * 0.2); c.fill();
    c.fillStyle = '#8a6a2a'; c.fillRect(-r * 0.45, -r * 2.0, r * 0.9, r * 0.6); c.fillStyle = '#121014'; c.fillRect(-r * 0.4, -r * 1.95, r * 0.8, r * 0.48);
    c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(r * 0.35, -r * 2.05, r * 0.22, 0, 7); c.fill(); c.fillStyle = '#b3242c'; c.beginPath(); c.arc(r * 0.35, -r * 2.05, r * 0.08, 0, 7); c.fill();
    c.fillStyle = '#b3242c'; c.fillRect(-r * 0.12, -r * 1.35, r * 0.18, r * 1.0);
    c.fillStyle = '#121014'; c.beginPath(); c.moveTo(-r * 0.35, -r * 2.2); c.quadraticCurveTo(-r * 0.3, -r * 3.1, r * 0.15, -r * 3.0); c.quadraticCurveTo(r * 0.45, -r * 2.6, r * 0.3, -r * 2.15); c.fill();
    c.fillStyle = '#2a0a0e'; c.beginPath(); c.ellipse(-r * 0.12, -r * 2.55, r * 0.15, r * 0.22, 0, 0, 7); c.fill();
    c.fillStyle = '#ff3a3a'; c.fillRect(-r * 0.22, -r * 2.6, r * 0.18, r * 0.04);
    c.save(); c.translate(-r * 0.35, -r * 1.5); c.rotate(-0.9 + (b.cast > 0 ? -0.5 : Math.sin(t) * 0.05));
    c.fillStyle = '#8a6a2a'; c.fillRect(-4, -r * 0.15, 8, r * 0.4); c.fillRect(-r * 0.2, -r * 0.18, r * 0.4, 5);
    c.fillStyle = '#1a1416'; c.beginPath(); c.moveTo(-r * 0.12, -r * 0.18); c.lineTo(-r * 0.15, -r * 2.2); c.lineTo(0, -r * 2.4); c.lineTo(r * 0.15, -r * 2.2); c.lineTo(r * 0.12, -r * 0.18); c.fill();
    c.fillStyle = '#b3242c'; for (let i = 0; i < 5; i++) c.fillRect(-2, -r * (0.45 + i * 0.36), 4, r * 0.18);
    c.restore();
    // the scroll of sentences
    c.strokeStyle = b.cast > 0 ? '#ff3a3a' : '#b3242c'; c.lineWidth = b.cast > 0 ? 7 : 5; c.globalAlpha = 0.85;
    c.beginPath(); c.ellipse(0, -r * 2.3, r * 1.5, r * 0.4, -0.15, t % 6.28, t % 6.28 + 4.2); c.stroke();
    c.globalAlpha = b.hitT > 0 ? 0.7 : 1;
  }
  c.globalAlpha = 1;
  if (b.stun > 0) { c.fillStyle = '#e3b456'; c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText('✶ ✶ ✶', 0, -r * 3.3); }
  c.restore();
}
