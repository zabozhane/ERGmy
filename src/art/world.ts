// Parallax backgrounds per chapter, placeholder until painted layers (ROADMAP §7).
import { GROUND, H, W, type Chapter } from '../data';

type Ctx = CanvasRenderingContext2D;
export interface Particle { x: number; y: number; s: number; v: number; ph: number }

function ridge(c: Ctx, off: number, base: number, amp: number, col: string, seed: number) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 10) { const wx = x + off; c.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(wx * 0.005 + seed)) * (0.6 + 0.4 * Math.sin(wx * 0.013 + seed * 2))); }
  c.lineTo(W, H); c.fill();
}
function prop(c: Ctx, ch: Chapter, scroll: number) {
  const p = ch.prop;
  if (p === 'bamboo') {
    for (let i = 0; i < 9; i++) { const x = ((i * 83 - scroll * 0.55) % 720 + 720) % 720 - 60; c.fillStyle = i % 2 ? '#2f4a35' : '#365640'; c.fillRect(x, 40, 9, GROUND - 40); c.fillStyle = '#22382a'; for (let j = 0; j < 6; j++) c.fillRect(x - 1, 60 + j * 48, 11, 3); }
  } else if (p === 'torii') {
    const x = W - ((scroll * 0.6) % 900) + 80; c.fillStyle = '#1a0c14';
    c.fillRect(x, 190, 9, GROUND - 190); c.fillRect(x + 82, 190, 9, GROUND - 190); c.fillRect(x - 16, 182, 124, 8); c.fillRect(x - 12, 190, 116, 7); c.fillRect(x - 4, 210, 99, 6);
  } else if (p === 'castle') {
    const x = W - ((scroll * 0.25) % 1000) + 160; c.fillStyle = '#2e3242'; c.fillRect(x, 220, 120, 60);
    for (let i = 0; i < 3; i++) { const w = 140 - i * 36; c.fillStyle = '#262a38'; c.beginPath(); c.moveTo(x + 60 - w / 2 - 8, 220 - i * 44); c.lineTo(x + 60 + w / 2 + 8, 220 - i * 44); c.lineTo(x + 60 + w / 4, 204 - i * 44); c.lineTo(x + 60 - w / 4, 204 - i * 44); c.fill(); c.fillStyle = '#343a4e'; c.fillRect(x + 60 - w / 2 + 6, 176 - i * 44, w - 12, 30); }
    c.fillStyle = '#e0aa45'; c.fillRect(x + 52, 190, 6, 8); c.fillRect(x + 70, 146, 6, 8);
  } else if (p === 'pine') {
    for (let i = 0; i < 5; i++) { const x = ((i * 150 - scroll * 0.5) % 750 + 750) % 750 - 60;
      for (let j = 0; j < 3; j++) { c.fillStyle = '#2a3a50'; c.beginPath(); c.moveTo(x - 30 + j * 6, GROUND - 30 - j * 40); c.lineTo(x, GROUND - 90 - j * 40); c.lineTo(x + 30 - j * 6, GROUND - 30 - j * 40); c.fill();
        c.fillStyle = '#e6ecf5'; c.beginPath(); c.moveTo(x - 10, GROUND - 72 - j * 40); c.lineTo(x, GROUND - 90 - j * 40); c.lineTo(x + 10, GROUND - 72 - j * 40); c.fill(); } }
  } else if (p === 'volcano') {
    const x = 320 - (scroll * 0.08) % 900; c.fillStyle = '#2a0a0e'; c.beginPath(); c.moveTo(x - 220, GROUND); c.lineTo(x - 30, 120); c.lineTo(x + 30, 120); c.lineTo(x + 220, GROUND); c.fill();
    const g = c.createRadialGradient(x, 120, 2, x, 120, 60); g.addColorStop(0, '#ff8a3c'); g.addColorStop(1, 'rgba(255,138,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, 120, 60, 0, 7); c.fill();
  } else {
    const x = W - ((scroll * 0.3) % 800) + 60; c.fillStyle = '#4a2c5e'; c.fillRect(x, 130, 14, GROUND - 130); c.fillRect(x + 150, 130, 14, GROUND - 130);
    c.fillStyle = '#120c1c'; c.fillRect(x - 24, 118, 212, 14); c.fillStyle = '#6a3c7e'; c.fillRect(x - 14, 150, 192, 9);
  }
}

export function drawWorld(c: Ctx, ch: Chapter, scroll: number, parts: Particle[]) {
  const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, ch.sky[0]); g.addColorStop(1, ch.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(247,211,207,.9)'; c.beginPath(); c.arc(420, 120, ch.prop === 'torii' ? 78 : 30, 0, 7); c.fill();
  ridge(c, scroll * 0.08, 230, 100, ch.far, 1); prop(c, ch, scroll); ridge(c, scroll * 0.3, 280, 50, ch.near, 4);
  c.fillStyle = ch.ground; c.fillRect(0, GROUND, W, H - GROUND);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let x = -(scroll % 48); x < W; x += 48) c.fillRect(x, GROUND + 16, 24, 3);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, GROUND, W, 3);
  for (const p of parts) {
    if (ch.part === 'petal') { c.fillStyle = '#f7c2d0'; c.beginPath(); c.ellipse(p.x, p.y, p.s * 1.7, p.s, p.ph, 0, 7); c.fill(); }
    else if (ch.part === 'leaf') { c.fillStyle = '#8fb36a'; c.beginPath(); c.ellipse(p.x, p.y, p.s * 2.2, p.s * 0.8, p.ph, 0, 7); c.fill(); }
    else if (ch.part === 'snow') { c.fillStyle = '#f2f5fa'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); }
    else if (ch.part === 'ember') { c.fillStyle = 'rgba(255,140,70,' + (0.4 + 0.4 * Math.sin(p.ph * 3)) + ')'; c.fillRect(p.x, p.y, p.s, p.s); }
    else { c.fillStyle = 'rgba(200,205,220,.05)'; c.beginPath(); c.arc(p.x, p.y * 0.5 + 150, 30 + p.s * 12, 0, 7); c.fill(); }
  }
}

export function stepParticles(parts: Particle[], ch: Chapter, dt: number, moving: boolean) {
  for (const p of parts) {
    p.ph += dt;
    if (ch.part === 'ember') { p.y -= p.v * 40 * dt; p.x -= (moving ? 70 : 10) * dt; if (p.y < 0) { p.y = H; p.x = Math.random() * W; } }
    else { p.x -= (p.v * 40 + (moving ? 70 : 0)) * dt; p.y += p.v * (ch.part === 'snow' ? 40 : 22) * dt; }
    if (p.x < -5) { p.x = W + 5; p.y = Math.random() * H * 0.7; }
    if (p.y > H) p.y = 0;
  }
}
