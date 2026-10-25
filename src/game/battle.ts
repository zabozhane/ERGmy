// Battle simulation: running, spawning, auto-attack, skills, loot and stage progress.
// Pure canvas drawing so the same frame renders inside a Phaser CanvasTexture.
import { FOE, GROUND, H, PX, RC, RN, SLOTS, W, type FoeKind } from '../data';
import {
  S, atk, buffActive, buffs, chap, cls, critCh, curW, cdMul, fmt, genItem, goldMul, isUpgrade, itemKj, itemName,
  maxHp, qTick, rt, save, sellVal, skF, stageLabel, xpNeed, type Item,
} from '../state';
import { drawHero } from '../art/hero';
import { drawFoe } from '../art/foes';
import { drawWorld, stepParticles, type Particle } from '../art/world';
import { emit } from '../events';

interface Enemy { kind: FoeKind; boss?: boolean; x: number; hp: number; max: number; r: number; col: string; dmg: number; hitT: number; ph: number; stun: number }
interface Shot { x: number; y: number; vx: number; vy: number; kind: 'arrow' | 'star'; pierce: boolean; hit: Enemy[]; mult: number; big?: boolean; rot?: number; dead?: boolean }
interface Drop { x: number; y: number; vy: number; it: Item; got?: boolean }
interface Fx { x: number; y: number; t: number; col?: string; r?: number; arrow?: boolean; smoke?: boolean; ring?: boolean }
interface FloatText { x: number; y: number; txt: string; col: string; t: number; big?: boolean }
interface Slash { t: number; r: number; col: string; wide?: boolean }

let enemies: Enemy[] = [], shots: Shot[] = [], texts: FloatText[] = [], slashes: Slash[] = [], drops: Drop[] = [], fx: Fx[] = [];
const parts: Particle[] = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 2, v: 0.3 + Math.random() * 0.7, ph: Math.random() * 6 }));
let scroll = 0, atkTimer = 0, hurtTimer = 0, anim = 0, flash = 0;
export const battle = { bossOn: false, bossT: 0 };
export const skillCd = [0, 0, 0];

export function resetBattle() { enemies = []; shots = []; drops = []; battle.bossOn = false; skillCd.fill(0); }

function spawn() {
  const c = chap(); const base = 12 * Math.pow(1.21, S.stage - 1);
  const last = enemies.length ? enemies[enemies.length - 1].x : W;
  if (S.kills >= 10 && !S.bossFail && !battle.bossOn) {
    battle.bossOn = true; battle.bossT = 30;
    enemies.push({ kind: c.boss, boss: true, x: Math.max(W + 70, last + 140), hp: base * 16, max: base * 16, r: 44, col: FOE[c.boss].col, dmg: 7 * Math.pow(1.17, S.stage - 1), hitT: 0, ph: 0, stun: 0 });
    emit('toast', 'Босс: ' + c.bossName, RC[4]); emit('top'); return;
  }
  if (battle.bossOn) return;
  const k = c.foes[Math.floor(Math.random() * c.foes.length)];
  enemies.push({ kind: k, x: Math.max(W + 30, last + 80 + Math.random() * 110), hp: base, max: base, r: FOE[k].r, col: FOE[k].col, dmg: 2 * Math.pow(1.15, S.stage - 1), hitT: 0, ph: Math.random() * 6, stun: 0 });
}
const float = (x: number, y: number, txt: string, col: string, big = false) => texts.push({ x, y, txt, col, t: 1, big });

function damage(e: Enemy, mult: number) {
  const crit = Math.random() < critCh();
  const d = atk() * curW().mult * mult * (crit ? 2.2 : 1);
  e.hp -= d; e.hitT = 0.12;
  float(e.x + (Math.random() * 16 - 8), GROUND - e.r * 2 - 14, fmt(d) + (crit ? '!' : ''), crit ? '#f6dc8f' : '#efe7d4', crit);
}
function dropLoot(x: number, minR: number, boost: number) {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)].id;
  drops.push({ x, y: GROUND - 40, vy: -260, it: genItem(slot, S.stage, minR, boost) });
}
function pickup(it: Item) {
  if (S.inv.length >= 42) { const v = sellVal(it); S.gold += v; emit('toast', 'Сумка полна, продано +' + fmt(v), RC[it.r]); return; }
  S.inv.push(it);
  emit('toast', itemName(it) + (isUpgrade(it) ? ' ▲' : ''), RC[it.r], RN[it.r]);
  emit('loot');
}
function killCheck() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]; if (e.hp > 0) continue;
    const g = Math.ceil((e.boss ? 50 : 4) * Math.pow(1.19, S.stage - 1) * goldMul());
    S.gold += g; S.xp += e.boss ? 20 : 3; float(e.x, GROUND - 70, '+' + fmt(g) + ' 金', '#e3b456');
    if (e.boss) dropLoot(e.x, 1, 2.2); else if (Math.random() < 0.13) dropLoot(e.x, 0, 1);
    fx.push({ x: e.x, y: GROUND - e.r, t: 1, col: e.col, r: e.r });
    if (e.boss) {
      battle.bossOn = false; S.stage++; S.best = Math.max(S.best, S.stage); S.kills = 0; S.soul += 5; flash = 1; S.hp = maxHp(); qTick('boss');
      emit('toast', 'Этап ' + stageLabel(S.stage) + (S.stage % 10 === 1 ? ' · ' + chap().name : '') + ' · +5 魂', '#ec6b90');
    } else { S.kills++; qTick('kill'); }
    enemies.splice(i, 1);
    while (S.xp >= xpNeed()) {
      S.xp -= xpNeed(); S.lvl++; S.hp = maxHp(); float(PX, GROUND - 120, 'Уровень ' + S.lvl, '#ec6b90', true);
      const sk = cls().skills.find(s => s.lvl === S.lvl);
      if (sk) { emit('toast', 'Новый навык: ' + sk.name, '#ec6b90'); emit('skills'); }
    }
    save(); emit('top'); emit('progress');
  }
}

function fire(kind: 'arrow' | 'star', mult: number, o: { big?: boolean; n?: number; spread?: number } = {}) {
  if (kind === 'arrow') { shots.push({ x: PX + 26, y: GROUND - 58, vx: 950, vy: 0, kind: 'arrow', pierce: true, hit: [], mult, big: o.big }); return; }
  const n = o.n || 3, sp = o.spread || 0.12;
  for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * sp; shots.push({ x: PX + 22, y: GROUND - 58, vx: 720 * Math.cos(a), vy: 720 * Math.sin(a), kind: 'star', pierce: false, hit: [], mult, rot: 0 }); }
}
function attack() {
  const w = curW();
  const tgt = enemies.filter(e => e.x - PX <= w.range && e.x > PX - 30);
  if (!tgt.length || atkTimer > 0) return;
  atkTimer = w.cd * cdMul(); anim = 1;
  if (w.kind === 'melee') { damage(tgt[0], 1); slashes.push({ t: 1, r: 58, col: '#efe7d4' }); }
  else if (w.kind === 'sweep') { tgt.forEach(e => damage(e, 1)); slashes.push({ t: 1, r: 105, col: '#efe7d4' }); }
  else if (w.kind === 'arrow') fire('arrow', 1);
  else { fire('star', 1); if (buffActive('clone')) setTimeout(() => fire('star', 1), 90); }
}

export function castSkill(i: number) {
  const sk = cls().skills[i];
  if (!sk || S.lvl < sk.lvl || skillCd[i] > 0 || !S.cls || !S.g) return;
  const f = skF(i), dur = 0.5 * (S.skL[i] || 0), t = rt.t;
  const near = enemies.filter(e => e.x < W + 10), inR = (r: number) => near.filter(e => e.x - PX <= r);
  let used = true;
  switch (sk.id) {
    case 'iai': { const e = inR(200)[0]; if (!e) { used = false; break; } damage(e, 6 * f); slashes.push({ t: 1, r: 90, col: '#f6dc8f', wide: true }); flash = 0.4; break; }
    case 'petal': { const es = inR(160); if (!es.length) { used = false; break; }
      for (let k = 0; k < 3; k++) setTimeout(() => { es.forEach(e => { if (e.hp > 0) damage(e, 2 * f); }); slashes.push({ t: 1, r: 70 + k * 15, col: '#ec6b90' }); }, k * 140); break; }
    case 'kiai': buffs.kiai = t + 6 + dur; float(PX, GROUND - 130, 'Киай!', '#f6dc8f', true); break;
    case 'whirl': { const es = inR(170); if (!es.length) { used = false; break; } es.forEach(e => damage(e, 3 * f)); slashes.push({ t: 1, r: 150, col: '#f6dc8f', wide: true }); break; }
    case 'quake': if (!near.length) { used = false; break; } near.forEach(e => { damage(e, 2 * f); e.stun = 2; }); fx.push({ x: PX + 60, y: GROUND, t: 1, col: '#e3b456', r: 200, ring: true }); flash = 0.3; break;
    case 'will': S.hp = Math.min(maxHp(), S.hp + maxHp() * 0.4 * f); float(PX, GROUND - 130, 'Исцеление', '#7fbf6a', true); break;
    case 'pierce': if (!near.length) { used = false; break; } fire('arrow', 6 * f, { big: true }); break;
    case 'rain': if (!near.length) { used = false; break; }
      near.forEach(e => { for (let k = 0; k < 4; k++) fx.push({ x: e.x + Math.random() * 40 - 20, y: -20 - k * 40, t: 1, arrow: true }); });
      setTimeout(() => near.forEach(e => { if (e.hp > 0) damage(e, 2.5 * f); }), 300); break;
    case 'hawk': buffs.hawk = t + 6 + dur; float(PX, GROUND - 130, 'Глаз ястреба', '#f6dc8f', true); break;
    case 'fan': if (!near.length) { used = false; break; } fire('star', f, { n: 9, spread: 0.09 }); break;
    case 'smoke': buffs.smoke = t + 3 + dur; inR(140).forEach(e => damage(e, 2 * f)); fx.push({ x: PX, y: GROUND - 40, t: 1, smoke: true }); break;
    case 'clone': buffs.clone = t + 7 + dur; float(PX, GROUND - 130, 'Теневой клон', '#a678dc', true); break;
  }
  if (used) { skillCd[i] = sk.cd; anim = 1; qTick('skill'); }
}

export function update(dt: number) {
  rt.t += dt;
  while (enemies.length < 4 && !battle.bossOn) spawn();
  if (!enemies.length && battle.bossOn) battle.bossOn = false;
  atkTimer -= dt; hurtTimer -= dt; anim = Math.max(0, anim - dt * 4); flash = Math.max(0, flash - dt * 1.5);
  for (let i = 0; i < 3; i++) skillCd[i] = Math.max(0, skillCd[i] - dt);
  if (S.auto) for (let i = 0; i < 3; i++) castSkill(i);
  const w = curW(); attack();
  const blocking = enemies.some(e => e.x - PX < w.range);
  if (!blocking) { const sp = 200 * dt; scroll += sp; enemies.forEach(e => e.x -= sp); drops.forEach(d => d.x -= sp); }
  for (const e of enemies) {
    e.hitT -= dt; e.ph += dt * 5; e.stun = Math.max(0, e.stun - dt); if (e.stun > 0) continue;
    if (e.x - PX > 40) { if (blocking) e.x -= 55 * dt; }
    else if (hurtTimer <= 0 && !buffActive('smoke')) { S.hp -= e.dmg; hurtTimer = 0.75; float(PX, GROUND - 100, '-' + fmt(e.dmg), '#e2566c'); }
    if (e.x < PX + 38) e.x = PX + 38;
  }
  if (battle.bossOn) {
    battle.bossT -= dt;
    if (battle.bossT <= 0) { enemies = enemies.filter(e => !e.boss); battle.bossOn = false; S.bossFail = true; S.kills = 0; emit('toast', 'Время вышло. Тренируйся и вызови босса снова', '#e2566c'); emit('top'); }
  }
  S.hp = Math.min(maxHp(), S.hp + maxHp() * 0.012 * dt);
  if (S.hp <= 0) {
    S.hp = maxHp(); enemies = []; shots = []; battle.bossOn = false; S.kills = 0; if (S.stage > 1) S.stage--;
    emit('toast', 'Отступление к храму · ' + stageLabel(S.stage), '#e2566c'); save(); emit('top');
  }
  for (const s of shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; if (s.rot !== undefined) s.rot += dt * 22;
    for (const e of enemies) {
      if (s.dead || s.hit.includes(e)) continue;
      // test against the whole body height so small yokai at point-blank range are hit too
      if (Math.abs(s.x - e.x) < e.r + 4 && s.y > GROUND - e.r * 2.8 - 8 && s.y < GROUND + 4) { damage(e, s.mult); s.hit.push(e); if (!s.pierce) s.dead = true; }
    }
    if (s.x > W + 40 || s.y < -20 || s.y > H) s.dead = true;
  }
  shots = shots.filter(s => !s.dead);
  for (const d of drops) { d.vy += 700 * dt; d.y = Math.min(GROUND - 10, d.y + d.vy * dt); if (d.x < PX + 20 && !d.got) { d.got = true; pickup(d.it); } }
  drops = drops.filter(d => !d.got && d.x > -30);
  killCheck();
  slashes.forEach(s => s.t -= dt * 4); slashes = slashes.filter(s => s.t > 0);
  fx.forEach(f => { f.t -= dt * (f.arrow ? 3 : 2); if (f.arrow) f.y += 900 * dt; }); fx = fx.filter(f => f.t > 0);
  texts.forEach(t => { t.t -= dt * 0.9; t.y -= 30 * dt; }); texts = texts.filter(t => t.t > 0);
  stepParticles(parts, chap(), dt, !blocking);
}

export function draw(ctx: CanvasRenderingContext2D) {
  const c = chap();
  drawWorld(ctx, c, scroll, parts);
  for (const d of drops) {
    const col = RC[d.it.r];
    if (d.it.r >= 3) { ctx.fillStyle = col + '33'; ctx.fillRect(d.x - 8, 0, 16, d.y); }
    ctx.save(); ctx.translate(d.x, d.y); ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = '#231d1c'; ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(-9, -9, 18, 18); ctx.shadowBlur = 0;
    ctx.fillStyle = col; ctx.font = '13px "Zen Antique",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(itemKj(d.it), 0, 1); ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';
  enemies.forEach(e => drawFoe(ctx, e));
  const stopped = enemies.some(e => e.x - PX < curW().range);
  if (S.g) {
    drawHero(ctx, PX, GROUND, 1, S.eq, { g: S.g, t: rt.t, run: !stopped, anim, wt: cls().w, smoke: buffActive('smoke') });
    if (buffActive('clone')) drawHero(ctx, PX - 30, GROUND, 1, S.eq, { g: S.g, t: rt.t + 0.2, run: !stopped, anim, wt: cls().w, smoke: true });
  }
  for (const s of shots) {
    ctx.save(); ctx.translate(s.x, s.y);
    if (s.kind === 'arrow') {
      ctx.strokeStyle = s.big ? '#f6dc8f' : '#efe7d4'; ctx.lineWidth = s.big ? 3 : 2; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = '#d6a84e'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.fill(); ctx.fillStyle = '#efe7d4'; ctx.fillRect(-30, -3, 6, 6);
    } else {
      ctx.rotate(s.rot || 0); ctx.fillStyle = '#c8ccd8';
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.fill(); }
    }
    ctx.restore();
  }
  for (const s of slashes) { ctx.save(); ctx.globalAlpha = s.t; ctx.strokeStyle = s.col; ctx.lineWidth = s.wide ? 7 : 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(PX + 8, GROUND - 55, s.r, -1.2, 0.7); ctx.stroke(); ctx.restore(); }
  for (const f of fx) {
    ctx.save(); ctx.globalAlpha = Math.max(0, f.t);
    if (f.arrow) { ctx.strokeStyle = '#efe7d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y - 24); ctx.lineTo(f.x, f.y); ctx.stroke(); }
    else if (f.smoke) { ctx.fillStyle = '#a0a6c0'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(f.x + Math.cos(i) * 30 * (2 - f.t), f.y + Math.sin(i * 2) * 20, 22, 0, 7); ctx.fill(); } }
    else if (f.ring) { ctx.strokeStyle = f.col!; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r! * (1.2 - f.t), 20 * (1.2 - f.t), 0, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = f.col!; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28, d = (1 - f.t) * f.r! * 1.6; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 3, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  ctx.textAlign = 'center';
  for (const t of texts) {
    ctx.globalAlpha = Math.max(0, t.t); ctx.fillStyle = t.col; ctx.font = (t.big ? 'bold 19px' : 'bold 15px') + ' "JetBrains Mono",monospace';
    ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  if (S.g) { const bw = 56; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(PX - bw / 2, GROUND - 138, bw, 6); ctx.fillStyle = '#ec6b90'; ctx.fillRect(PX - bw / 2, GROUND - 138, bw * Math.max(0, S.hp / maxHp()), 6); }
  const b = battle.bossOn && enemies.find(e => e.boss);
  if (b) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(150, H - 26, 240, 12); ctx.fillStyle = '#e2566c'; ctx.fillRect(150, H - 26, 240 * Math.max(0, b.hp / b.max), 12);
    ctx.strokeStyle = '#e3b456'; ctx.lineWidth = 1.5; ctx.strokeRect(150, H - 26, 240, 12);
    ctx.textAlign = 'center'; ctx.fillStyle = '#efe7d4'; ctx.font = 'bold 12px "Golos Text",sans-serif'; ctx.fillText(c.bossName + ' · ' + Math.ceil(battle.bossT) + ' с', 270, H - 32);
  }
  if (flash > 0) { ctx.fillStyle = 'rgba(227,180,86,' + flash * 0.25 + ')'; ctx.fillRect(0, 0, W, H); }
  if (!S.cls || !S.g) { ctx.fillStyle = 'rgba(15,19,34,.6)'; ctx.fillRect(0, 0, W, H); }
}
