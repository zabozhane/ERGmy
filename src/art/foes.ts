// Procedural yokai art, placeholder until sprites (ROADMAP §7).
import { GROUND, type FoeKind } from '../data';

type Ctx = CanvasRenderingContext2D;
export interface FoeLook { kind: FoeKind; x: number; r: number; col: string; ph: number; hitT: number; stun: number; boss?: boolean; hp: number; max: number }

function eyes(c: Ctx, x: number, y: number, r: number, col = '#fff') {
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 0.12, 0, 7); c.arc(x + r * 0.32, y, r * 0.12, 0, 7); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(x - 1, y, r * 0.05, 0, 7); c.arc(x + r * 0.32 - 1, y, r * 0.05, 0, 7); c.fill();
}

export function drawFoe(c: Ctx, e: FoeLook) {
  const r = e.r, k = e.kind, hover = k === 'yurei' ? Math.sin(e.ph) * 4 - 8 : 0, bob = Math.sin(e.ph) * 1.5, col = e.col;
  c.save(); c.translate(e.x, GROUND + bob + hover); if (e.hitT > 0) c.globalAlpha = 0.6;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, -hover, r * 0.9, r * 0.18, 0, 0, 7); c.fill();
  if (k === 'kappa') {
    c.fillStyle = '#6b4a2e'; c.beginPath(); c.ellipse(-r * 0.45, -r, r * 0.6, r * 0.8, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * 0.95, r * 0.75, r * 0.9, 0, 0, 7); c.fill();
    c.fillStyle = '#d9d58f'; c.beginPath(); c.ellipse(-r * 0.05, -r * 1.78, r * 0.45, r * 0.14, 0, 0, 7); c.fill();
    c.fillStyle = '#2a3a22'; c.beginPath(); c.moveTo(-r * 0.55, -r * 1.7);
    for (let i = 0; i < 6; i++) c.lineTo(-r * 0.55 + i * r * 0.22, -r * 1.62 + (i % 2) * r * 0.18);
    c.lineTo(r * 0.6, -r * 1.6); c.fill();
    c.fillStyle = '#d9b545'; c.beginPath(); c.moveTo(-r * 0.6, -r * 1.1); c.lineTo(-r * 1.0, -r * 1.0); c.lineTo(-r * 0.6, -r * 0.9); c.fill();
    eyes(c, -r * 0.35, -r * 1.3, r);
  } else if (k === 'tanuki') {
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r, r, r, 0, 0, 7); c.fill();
    c.fillStyle = '#d8c19e'; c.beginPath(); c.ellipse(-r * 0.1, -r * 0.8, r * 0.6, r * 0.65, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(-r * 0.1, -r * 1.95, r * 0.55, 0, 7); c.fill();
    c.beginPath(); c.arc(-r * 0.5, -r * 2.4, r * 0.18, 0, 7); c.arc(r * 0.3, -r * 2.4, r * 0.18, 0, 7); c.fill();
    c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(-r * 0.32, -r * 1.95, r * 0.22, r * 0.14, 0, 0, 7); c.ellipse(r * 0.12, -r * 1.95, r * 0.22, r * 0.14, 0, 0, 7); c.fill();
    c.fillStyle = '#8c6f45'; c.beginPath(); c.moveTo(-r * 1.0, -r * 2.25); c.lineTo(-r * 0.1, -r * 2.85); c.lineTo(r * 0.8, -r * 2.25); c.fill();
    c.fillStyle = '#fff'; c.fillRect(-r * 0.36, -r * 1.98, 2, 2); c.fillRect(r * 0.06, -r * 1.98, 2, 2);
  } else if (k === 'oni') {
    c.save(); c.translate(-r * 0.7, -r * 1.1); c.rotate(-0.5 + Math.sin(e.ph * 1.5) * 0.3);
    c.fillStyle = '#3a3030'; c.fillRect(-4, -r * 1.6, 8, r * 1.6); c.fillStyle = '#6a6060'; for (let i = 0; i < 4; i++) c.fillRect(-6, -r * 1.5 + i * r * 0.32, 12, 3); c.restore();
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * 1.05, r * 0.85, r * 1.05, 0, 0, 7); c.fill();
    c.fillStyle = '#e6b450'; c.fillRect(-r * 0.85, -r * 0.55, r * 1.7, r * 0.45); c.fillStyle = '#2a2020'; for (let i = 0; i < 4; i++) c.fillRect(-r * 0.7 + i * r * 0.42, -r * 0.55, r * 0.12, r * 0.45);
    c.fillStyle = '#2a1a1a'; c.beginPath(); c.arc(0, -r * 1.85, r * 0.5, Math.PI, 0); c.fill();
    c.fillStyle = '#efe7d4'; c.beginPath(); c.moveTo(-r * 0.45, -r * 1.95); c.lineTo(-r * 0.35, -r * 2.6); c.lineTo(-r * 0.18, -r * 2.0); c.fill();
    c.beginPath(); c.moveTo(r * 0.18, -r * 2.0); c.lineTo(r * 0.35, -r * 2.6); c.lineTo(r * 0.45, -r * 1.95); c.fill();
    eyes(c, -r * 0.25, -r * 1.5, r, '#ffd36a');
    c.fillStyle = '#efe7d4'; c.fillRect(-r * 0.35, -r * 1.2, r * 0.12, r * 0.18); c.fillRect(r * 0.05, -r * 1.2, r * 0.12, r * 0.18);
  } else if (k === 'tengu') {
    c.fillStyle = '#1d1f2c'; c.beginPath(); c.moveTo(r * 0.2, -r * 1.5); c.quadraticCurveTo(r * 1.4, -r * 2.4 + Math.sin(e.ph * 2) * r * 0.3, r * 1.1, -r * 0.6); c.fill();
    c.fillStyle = '#e6dec9'; c.beginPath(); c.moveTo(-r * 0.7, -r * 1.5); c.lineTo(r * 0.7, -r * 1.5); c.lineTo(r * 0.9, 0); c.lineTo(-r * 0.9, 0); c.fill();
    c.fillStyle = '#2c3762'; c.fillRect(-r * 0.7, -r * 0.5, r * 1.4, r * 0.5);
    c.fillStyle = col; c.beginPath(); c.arc(0, -r * 1.9, r * 0.5, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-r * 0.3, -r * 1.95); c.lineTo(-r * 1.3, -r * 1.85); c.lineTo(-r * 0.3, -r * 1.75); c.fill();
    c.fillStyle = '#1a1a24'; c.fillRect(-r * 0.35, -r * 2.5, r * 0.7, r * 0.2); c.fillRect(-r * 0.1, -r * 2.65, r * 0.2, r * 0.2);
    eyes(c, -r * 0.2, -r * 2.05, r * 0.8);
  } else {
    c.globalAlpha = e.hitT > 0 ? 0.5 : 0.85;
    const g = c.createLinearGradient(0, -r * 2.2, 0, 0); g.addColorStop(0, col); g.addColorStop(1, col + '00');
    c.fillStyle = g; c.beginPath(); c.moveTo(-r * 0.7, -r * 1.5); c.quadraticCurveTo(-r * 0.9, -r * 0.3, -r * 0.3 + Math.sin(e.ph) * 4, 0); c.lineTo(r * 0.5, 0); c.quadraticCurveTo(r * 0.9, -r * 0.6, r * 0.7, -r * 1.5); c.fill();
    c.fillStyle = '#f2efe8'; c.beginPath(); c.arc(0, -r * 1.75, r * 0.5, 0, 7); c.fill();
    c.fillStyle = '#14141c'; c.beginPath(); c.moveTo(-r * 0.55, -r * 1.9); c.quadraticCurveTo(-r * 0.2, -r * 2.5, r * 0.55, -r * 1.9); c.lineTo(r * 0.7, -r * 0.9); c.lineTo(r * 0.35, -r * 1.6); c.lineTo(-r * 0.25, -r * 1.85); c.lineTo(-r * 0.6, -r * 1.0); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-r * 0.3, -r * 2.2); c.lineTo(0, -r * 2.45); c.lineTo(r * 0.3, -r * 2.2); c.fill();
    c.fillStyle = '#4a6a9a'; c.fillRect(-r * 0.3, -r * 1.75, r * 0.15, r * 0.06);
  }
  c.globalAlpha = 1;
  if (e.stun > 0) { c.fillStyle = '#e3b456'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('✶ ✶', 0, -r * 2.8); }
  if (!e.boss) { const bw = r * 1.8; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-bw / 2, -r * 2.75 - hover, bw, 4); c.fillStyle = '#e2566c'; c.fillRect(-bw / 2, -r * 2.75 - hover, bw * Math.max(0, e.hp / e.max), 4); }
  c.restore();
}
