// Procedural hero art. Placeholder until layered SVG sprites (ROADMAP §7);
// every equipment slot already draws as its own layer so the swap is local.
import { RC, type Gender, type WeaponType } from '../data';
import type { Item, Save } from '../state';
import { drawSprite, hasSprite } from './sprites';

type Ctx = CanvasRenderingContext2D;
/** procedural: force the drawn hero, which still shows every equipped piece (the gear tab) */
export interface HeroPose { g: Gender; t: number; run: boolean; anim: number; wt: WeaponType; smoke?: boolean; procedural?: boolean }

export function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round((n >> 16) * f)), g = Math.min(255, Math.round((n >> 8 & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function lacing(c: Ctx, x: number, y: number, w: number, h: number, col: string, rows: number) {
  c.fillStyle = '#231d1c'; c.fillRect(x, y, w, h); c.fillStyle = col;
  const rh = h / rows; for (let i = 0; i < rows; i++) c.fillRect(x, y + i * rh + rh * 0.35, w, rh * 0.35);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, y, w, 1.5);
}
function tsuka(c: Ctx, x1: number, y1: number, x2: number, y2: number, w: number) {
  c.save(); c.translate(x1, y1); c.rotate(Math.atan2(y2 - y1, x2 - x1)); const L = Math.hypot(x2 - x1, y2 - y1);
  c.fillStyle = '#141218'; c.fillRect(0, -w / 2, L, w); c.fillStyle = '#d8d2c2';
  for (let i = 2; i < L - 2; i += 4) { c.beginPath(); c.moveTo(i, -w / 2); c.lineTo(i + 2, 0); c.lineTo(i, w / 2); c.lineTo(i - 2, 0); c.fill(); }
  c.restore();
}
function sheath(c: Ctx, x1: number, y1: number, x2: number, y2: number, w: number) {
  c.save(); c.strokeStyle = '#0d0c10'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
}
export function drawWeapon(c: Ctx, wt: WeaponType, r: number | null, a: number, t: number) {
  const col = r != null ? RC[r] : '#8f96ad'; c.save();
  if (r != null && r >= 2) { c.shadowColor = col; c.shadowBlur = 8 + r * 3; }
  if (wt === 'katana') {
    c.rotate(a); c.fillStyle = '#2a2630'; c.fillRect(-2, -5, 4, 10); tsuka(c, -16, 0, -2, 0, 4); c.fillStyle = col; c.fillRect(-3, -5, 2, 10);
    c.fillStyle = '#e9ecf4'; c.beginPath(); c.moveTo(2, -2); c.quadraticCurveTo(30, -5, 52, -10); c.lineTo(52, -8); c.quadraticCurveTo(30, -1, 2, 2); c.fill();
  } else if (wt === 'nagi') {
    c.rotate(a * 0.8); c.fillStyle = '#2a1a16'; c.fillRect(-26, -2, 74, 4); c.fillStyle = col; c.fillRect(-2, -2.5, 6, 5); c.fillRect(40, -3, 4, 6);
    c.fillStyle = '#e9ecf4'; c.beginPath(); c.moveTo(46, -2); c.quadraticCurveTo(66, -4, 76, -16); c.quadraticCurveTo(70, 0, 46, 3); c.fill();
  } else if (wt === 'yumi') {
    c.strokeStyle = '#1c1418'; c.lineWidth = 3; c.beginPath(); c.moveTo(2, -46); c.quadraticCurveTo(16, -10, 4, 30); c.stroke();
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(7, -14); c.lineTo(9, -4); c.stroke();
    c.strokeStyle = '#efe7d4'; c.lineWidth = 1; c.beginPath(); c.moveTo(2, -46); c.lineTo(-4 - a * 6, -6); c.lineTo(4, 30); c.stroke();
  } else {
    c.rotate(t * 12); c.fillStyle = '#c8ccd8';
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -9); c.lineTo(3, 0); c.lineTo(-3, 0); c.fill(); }
    c.fillStyle = col; c.beginPath(); c.arc(0, 0, 2.5, 0, 7); c.fill();
  }
  c.restore();
}
function tattoo(c: Ctx, y0: number) {
  c.strokeStyle = 'rgba(30,30,40,.8)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-3, y0);
  c.bezierCurveTo(3, y0 + 3, -3, y0 + 6, 2, y0 + 9); c.bezierCurveTo(4, y0 + 11, -2, y0 + 13, 1, y0 + 16); c.stroke();
  c.fillStyle = 'rgba(30,30,40,.8)'; c.beginPath(); c.arc(-2, y0 + 1, 1.3, 0, 7); c.fill();
  c.beginPath(); c.moveTo(1, y0 + 4); c.lineTo(3.5, y0 + 5); c.lineTo(1, y0 + 6); c.fill();
}

export function drawHero(c: Ctx, x: number, y: number, s: number, eq: Save['eq'], o: HeroPose) {
  const g = o.g, t = o.t, run = o.run, ph = t * 13;
  const leg = run ? Math.sin(ph) : 0, bob = run ? -Math.abs(Math.sin(ph)) * 2.5 : 0;
  const A = eq.armor, Hm = eq.helm, Ar = eq.arms, L = eq.legs, Ch = eq.charm, Wp: Item | undefined = eq.weapon;
  const wt = Wp ? Wp.wt! : o.wt;
  const skin = g === 'f' ? '#f2dcd2' : '#e2bf9c', cloth = '#17161c', clothHi = '#34313e';
  const sway = Math.sin(t * (run ? 9 : 2)) * (run ? 4 : 1.5);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(4, 1, 26, 4, 0, 0, 7); c.fill();
  c.translate(0, bob);
  // aura from an epic+ charm, banner from a legendary+ armor
  if (Ch && Ch.r >= 2) { const gr = c.createRadialGradient(0, -50, 4, 0, -50, 60); gr.addColorStop(0, RC[Ch.r] + '55'); gr.addColorStop(1, RC[Ch.r] + '00'); c.fillStyle = gr; c.beginPath(); c.arc(0, -50, 60, 0, 7); c.fill(); }
  if (A && A.r >= 3) { c.fillStyle = '#2a2020'; c.fillRect(-18, -124, 2, 56); c.fillStyle = RC[A.r]; c.fillRect(-34, -124, 16, 28); c.fillStyle = '#121729'; c.font = '12px "Zen Antique",serif'; c.textAlign = 'center'; c.fillText('侍', -26, -106); }
  const swing = o.anim > 0 ? (-1.7 + (1 - o.anim) * 2.7) : (wt === 'yumi' ? 0 : -0.55);
  if (!o.procedural && hasSprite('hero_' + g)) { // painted hero; the weapon in hand is still drawn by code
    drawSprite(c, 'hero_' + g, 1, { breath: Math.sin(t * 2), lean: run ? Math.sin(ph) * 0.03 : (o.anim > 0 ? 0.06 : 0) });
    // the painted hero already wears a sheathed katana: a blade or bow in hand only when it is used
    if (o.anim > 0 || wt !== 'katana') { c.save(); c.translate(8, -50); drawWeapon(c, wt, Wp ? Wp.r : null, swing, t); c.restore(); }
    if (o.smoke) { c.fillStyle = 'rgba(160,166,192,.35)'; c.beginPath(); c.arc(0, -50, 40, 0, 7); c.fill(); }
    c.restore(); return;
  }
  if (g === 'f') { // long silver hair and the katana on her back
    c.fillStyle = '#d9dce6'; c.beginPath(); c.moveTo(-8, -96); c.quadraticCurveTo(-24, -70, -30 + sway, -34); c.lineTo(-20 + sway, -36); c.quadraticCurveTo(-14, -64, -2, -80); c.fill();
    c.strokeStyle = '#f1f2f7'; c.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6 - i * 2, -94); c.quadraticCurveTo(-20 - i * 2, -66, -26 - i * 2 + sway, -30 - i * 3); c.stroke(); }
    sheath(c, -14, -36, 8, -100, 4.5); c.strokeStyle = '#d33b45'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-8, -56); c.lineTo(-3, -60); c.moveTo(-9, -52); c.lineTo(-2, -56); c.stroke();
    tsuka(c, 8, -100, 15, -118, 4);
  }
  const legDraw = (dx: number, sw: number, back: boolean) => {
    c.save(); c.translate(dx, -38); c.rotate(sw * 0.42);
    c.fillStyle = back ? '#0f0e13' : cloth; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(11, 24); c.lineTo(-11, 24); c.fill();
    if (L) { c.fillStyle = shade(RC[L.r], back ? 0.55 : 0.8); c.fillRect(-5, 22, 10, 14); c.fillStyle = '#231d1c'; for (let i = 0; i < 3; i++) c.fillRect(-5, 25 + i * 4, 10, 1.2); if (L.r >= 3) { c.fillStyle = '#e0aa45'; c.fillRect(-5, 22, 10, 2); } }
    else if (g === 'm') { c.fillStyle = back ? '#0b0a0e' : '#141318'; c.fillRect(-5, 20, 11, 16); }
    else { c.fillStyle = back ? '#bfb8aa' : '#e2dccd'; c.fillRect(-4, 22, 8, 14); c.fillStyle = '#b3242c'; c.fillRect(-4, 27, 8, 1.5); }
    c.fillStyle = g === 'm' ? '#0b0a0e' : '#2a2024'; c.fillRect(-5, 35, 13, 4); c.restore();
  };
  legDraw(-3, -leg, true); legDraw(3, leg, false);
  c.save(); c.translate(-6, -70); c.rotate(run ? -leg * 0.6 : 0.3);
  c.fillStyle = Ar ? shade(RC[Ar.r], 0.5) : (g === 'f' ? shade('#f2dcd2', 0.8) : '#0f0e13'); c.fillRect(-4, 0, 8, 20); c.restore();
  if (g === 'm') { // long coat
    const fl = run ? Math.sin(ph) * 3 : 0;
    c.fillStyle = cloth; c.beginPath(); c.moveTo(-13, -76); c.lineTo(13, -76); c.lineTo(17 + fl * 0.5, -14); c.lineTo(-22 - fl, -12); c.fill();
    c.strokeStyle = clothHi; c.lineWidth = 1; c.beginPath(); c.moveTo(-6, -40); c.lineTo(-12 - fl, -14); c.moveTo(6, -40); c.lineTo(9, -14); c.stroke();
    c.fillStyle = cloth; c.beginPath(); c.moveTo(-14, -77); c.lineTo(14, -77); c.lineTo(13, -40); c.lineTo(-13, -40); c.fill();
    c.strokeStyle = '#45414f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-6, -77); c.lineTo(3, -58); c.moveTo(6, -77); c.lineTo(1, -66); c.stroke();
    c.fillStyle = skin; c.beginPath(); c.moveTo(-4, -77); c.lineTo(4, -77); c.lineTo(1, -70); c.fill();
  } else { // sleeveless top, kimono draped at the hips
    c.fillStyle = cloth; c.beginPath(); c.moveTo(-10, -74); c.lineTo(10, -74); c.lineTo(12, -40); c.lineTo(-12, -40); c.fill();
    c.fillStyle = skin; c.beginPath(); c.moveTo(-11, -75); c.lineTo(-5, -75); c.lineTo(-9, -66); c.fill();
    c.fillStyle = cloth; c.fillRect(-5, -80, 10, 7);
    c.fillStyle = '#1d1b23'; c.beginPath(); c.moveTo(-15, -46); c.quadraticCurveTo(0, -50, 16, -45); c.lineTo(20, -26); c.quadraticCurveTo(0, -22, -22 + sway * 0.4, -24); c.fill();
    c.strokeStyle = clothHi; c.lineWidth = 1; c.beginPath(); c.moveTo(-8, -44); c.quadraticCurveTo(-10, -34, -14, -26); c.moveTo(6, -44); c.quadraticCurveTo(8, -34, 12, -27); c.stroke();
  }
  if (A) {
    lacing(c, -13, -74, 26, 30, RC[A.r], 5);
    for (let i = 0; i < 3; i++) lacing(c, -14 + i * 9.5, -44, 9, 14, shade(RC[A.r], 0.85), 3);
    if (A.r >= 1) { lacing(c, -19, -76, 9, 15, RC[A.r], 3); lacing(c, 10, -76, 9, 15, RC[A.r], 3); }
    if (A.r >= 4) { c.fillStyle = '#e0aa45'; c.beginPath(); c.arc(0, -62, 3.5, 0, 7); c.fill(); }
  }
  c.fillStyle = g === 'f' ? '#b3242c' : '#2a2830'; c.fillRect(-13, -46, 26, 5);
  if (g === 'm') { sheath(c, -4, -43, -36, -20, 4); tsuka(c, -4, -43, 12, -53, 4); c.fillStyle = '#3a3540'; c.fillRect(-6, -46, 3, 7); }
  if (Ch) { c.fillStyle = RC[Ch.r]; c.fillRect(8, -42, 6, 9); c.fillStyle = '#efe7d4'; c.fillRect(9, -40, 4, 1.5); }
  // head
  c.fillStyle = skin; c.beginPath(); c.arc(0, -87, 10, 0, 7); c.fill(); c.fillRect(-3, -80, 6, 4);
  const mask = !!Hm && Hm.r >= 4;
  if (g === 'f') {
    c.fillStyle = '#1a1a24'; c.fillRect(4, -89, 3, 1.8); c.fillStyle = '#d33b45'; c.fillRect(3, -87, 5, 1.2); c.fillRect(7, -81, 2.5, 1.5);
    if (!Hm || Hm.r === 0) { c.fillStyle = '#e4e7ef'; c.beginPath(); c.arc(-1, -89, 11, Math.PI * 0.92, Math.PI * 2.02); c.fill(); c.beginPath(); c.moveTo(10, -92); c.quadraticCurveTo(12, -84, 9, -74 + sway * 0.3); c.lineTo(6, -82); c.fill(); }
    c.fillStyle = '#1a1a24'; c.beginPath(); c.arc(-4, -84, 1.2, 0, 7); c.fill();
  } else {
    c.fillStyle = '#3a2a20'; c.beginPath(); c.moveTo(-1, -82); c.quadraticCurveTo(5, -74, 10, -82); c.lineTo(9, -79); c.quadraticCurveTo(5, -76, 0, -79); c.fill(); c.fillRect(-2, -84, 2, 5);
    if (!Hm) {
      c.fillStyle = '#2e2c33'; c.beginPath(); c.arc(-1, -89, 10.5, Math.PI * 0.9, Math.PI * 2.02); c.fill();
      c.strokeStyle = '#4a4752'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(6 - i * 4, -98); c.quadraticCurveTo(-4 - i * 2, -97, -10, -90 + i); c.stroke(); }
      c.fillStyle = '#1d1b22'; c.beginPath(); c.arc(-6, -101, 4.5, 0, 7); c.fill(); c.fillStyle = '#b3242c'; c.fillRect(-4, -99, 2, 3);
    }
    if (!mask) { c.fillStyle = '#0a0a0e'; c.beginPath(); c.moveTo(1, -91); c.lineTo(10, -91); c.lineTo(9.5, -87); c.lineTo(2, -87); c.fill(); c.fillRect(-6, -90.5, 8, 1.2); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(6, -90, 2, 1); }
  }
  if (Hm) {
    const col = RC[Hm.r];
    if (Hm.r === 0) { c.fillStyle = '#8c6f45'; c.beginPath(); c.moveTo(-22, -91); c.lineTo(0, -106); c.lineTo(22, -91); c.fill(); c.fillStyle = '#5a4632'; c.fillRect(-22, -92, 44, 2); }
    else {
      c.fillStyle = '#231d1c'; c.beginPath(); c.arc(0, -91, 12, Math.PI, 0); c.fill(); lacing(c, -15, -92, 30, 8, col, 2);
      c.fillStyle = shade(col, 0.7); c.beginPath(); c.moveTo(-15, -84); c.lineTo(-19, -77); c.lineTo(-11, -79); c.fill(); c.beginPath(); c.moveTo(15, -84); c.lineTo(19, -77); c.lineTo(11, -79); c.fill();
      c.fillStyle = '#d6a84e'; c.fillRect(-12, -93, 24, 2);
      if (Hm.r >= 2) { c.strokeStyle = '#d6a84e'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-2, -97); c.quadraticCurveTo(-14, -105, -12, -121); c.moveTo(2, -97); c.quadraticCurveTo(14, -105, 12, -121); c.stroke(); }
      if (Hm.r >= 3) { c.fillStyle = '#e0aa45'; c.beginPath(); c.arc(0, -105, 8, Math.PI * 0.1, Math.PI * 0.9, true); c.arc(0, -101, 6, Math.PI * 0.9, Math.PI * 0.1, false); c.fill(); }
      if (mask) { c.fillStyle = '#a8302f'; c.fillRect(-2, -87, 12, 8); c.fillStyle = '#e2566c'; c.shadowColor = '#e2566c'; c.shadowBlur = 8; c.fillRect(4, -90, 3, 2); c.shadowBlur = 0; }
    }
  }
  // front arm and weapon
  c.save(); c.translate(6, -70);
  const armA = wt === 'yumi' ? -1.45 : (run ? leg * 0.5 : 0.2) + (o.anim > 0 ? -0.6 : 0); c.rotate(armA);
  if (Ar) { c.fillStyle = RC[Ar.r]; c.fillRect(-4, 0, 8, 20); c.fillStyle = '#231d1c'; for (let i = 0; i < 3; i++) c.fillRect(-4, 5 + i * 5, 8, 1.5); }
  else if (g === 'f') { c.fillStyle = skin; c.fillRect(-3.5, 0, 7, 20); tattoo(c, 2); }
  else { c.fillStyle = cloth; c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.lineTo(8, 16); c.lineTo(-6, 18); c.fill(); c.fillStyle = skin; c.fillRect(-2.5, 16, 5, 5); }
  c.fillStyle = skin; c.beginPath(); c.arc(0, 22, 3.5, 0, 7); c.fill();
  c.translate(0, 22); c.rotate(-armA); drawWeapon(c, wt, Wp ? Wp.r : null, swing, t); c.restore();
  if (o.smoke) { c.fillStyle = 'rgba(160,166,192,.35)'; c.beginPath(); c.arc(0, -50, 40, 0, 7); c.fill(); }
  c.restore();
}

/** red backdrop for Yuki, pink with a big moon for Ren, after the reference art */
export function portraitBg(c: Ctx, w: number, h: number, g: Gender) {
  if (g === 'f') {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d4262f'); gr.addColorStop(1, '#8e161e'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(w * 0.5, h * 0.9, w * 0.55, h * 0.06, 0, 0, 7); c.fill();
  } else {
    c.fillStyle = '#e9578a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f7d3cf'; c.beginPath(); c.arc(w * 0.5, h * 0.34, w * 0.33, 0, 7); c.fill();
    c.fillStyle = 'rgba(20,10,20,.55)'; c.beginPath(); c.ellipse(w * 0.58, h * 0.9, w * 0.3, h * 0.025, 0, 0, 7); c.fill();
  }
}
