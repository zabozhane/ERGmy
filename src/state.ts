// Save data, derived stats, items and economy formulas.
import { CHAPTERS, CLASSES, OWNER, QUESTS, RM, SLOTS, WT, type Gender, type Quest, type SlotId, type WeaponType } from './data';

export interface Item {
  id: number; slot: SlotId; r: number; lv: number; pow: number;
  atk: number; hp: number; crit: number; gold: number; wt?: WeaponType;
}
export interface Save {
  gold: number; soul: number; lvl: number; xp: number; stage: number; best: number; kills: number;
  atkL: number; hpL: number; spdL: number; hp: number;
  cls: string | null; g: Gender | null; eq: Partial<Record<SlotId, Item>>; inv: Item[]; nid: number;
  auto: boolean; bossFail: boolean; last: number; q: number; qp: number; skL: number[]; bm: number;
}

const KEY = 'yomi-save-2';
export function fresh(): Save {
  return { gold: 0, soul: 0, lvl: 1, xp: 0, stage: 1, best: 1, kills: 0, atkL: 0, hpL: 0, spdL: 0, hp: 100, cls: null, g: null,
    eq: {}, inv: [], nid: 1, auto: true, bossFail: false, last: Date.now(), q: 0, qp: 0, skL: [0, 0, 0], bm: 1 };
}
function load(): Save {
  let s: Save | null = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
  if (!s || !s.eq) return fresh();
  const f = fresh() as any;
  for (const k in f) if ((s as any)[k] === undefined) (s as any)[k] = f[k];
  return s;
}
export let S: Save = load();
export function resetSave() { S = fresh(); save(); }
export function save() { S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage blocked */ } }

// runtime clock and timed buffs, shared by combat and stat formulas
export const rt = { t: 0 };
export const buffs: Record<string, number> = {};
export const buffActive = (n: string) => !!buffs[n] && buffs[n] > rt.t;

export const chap = () => CHAPTERS[Math.floor((S.stage - 1) / 10) % CHAPTERS.length];
export const cls = () => CLASSES.find(c => c.id === S.cls) || CLASSES[0];
export const stageLabel = (s: number) => (Math.floor((s - 1) / 10) + 1) + '-' + ((s - 1) % 10 + 1);

export function fmt(n: number) {
  n = Math.floor(n); if (n < 1000) return '' + n;
  const u = ['K', 'M', 'B', 'T', 'Qa']; let i = -1;
  while (n >= 1000 && i < 4) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : 1) + u[i];
}

/* items */
function rollR(boost: number) {
  const w = [60, 27, 10, 2.6, 0.4].map((x, i) => x * Math.pow(boost, i));
  let r = Math.random() * w.reduce((a, b) => a + b);
  for (let i = 0; i < 5; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}
export function genItem(slot: SlotId, stage: number, minR = 0, boost = 1): Item {
  const r = Math.max(minR, rollR(boost));
  const pow = (4 + stage * 3) * RM[r] * (0.85 + Math.random() * 0.3);
  const it: Item = { id: S.nid++, slot, r, lv: stage, pow: Math.round(pow), atk: 0, hp: 0, crit: 0, gold: 0 };
  if (slot === 'weapon') { it.wt = cls().w; it.atk = Math.round(pow); }
  else if (slot === 'helm') { it.hp = Math.round(pow * 3); it.crit = 0.01 * (r + 1); }
  else if (slot === 'armor') { it.hp = Math.round(pow * 6); }
  else if (slot === 'arms') { it.atk = Math.round(pow * 0.5); it.crit = 0.005 * (r + 1); }
  else if (slot === 'legs') { it.hp = Math.round(pow * 3); it.atk = Math.round(pow * 0.2); }
  else if (slot === 'charm') { it.gold = 0.06 * (r + 1); it.crit = 0.015 * (r + 1); }
  return it;
}
const slotDef = (id: SlotId) => SLOTS.find(s => s.id === id)!;
export const itemName = (it: Item) => (it.slot === 'weapon' ? WT[it.wt!].noun : slotDef(it.slot).noun) + ' ' + OWNER[it.r];
export const itemKj = (it: Item) => it.slot === 'weapon' ? WT[it.wt!].kj : slotDef(it.slot).kj;
export const score = (it?: Item) => it ? it.atk * 6 + it.hp + it.crit * 1500 + it.gold * 1200 : 0;
export const sellVal = (it: Item) => Math.ceil(it.pow * 1.5 * (it.r + 1));
export const isUpgrade = (it: Item) => score(it) > score(S.eq[it.slot]);

/* stats */
const eqList = () => Object.values(S.eq).filter(Boolean) as Item[];
const sum = (k: 'atk' | 'hp' | 'crit' | 'gold') => eqList().reduce((a, i) => a + (i[k] || 0), 0);
export const curW = () => S.eq.weapon ? WT[S.eq.weapon.wt!] : WT[cls().w];
export const atk = () => Math.floor((5 + S.lvl * 2 + S.atkL * 3 + sum('atk')) * (1 + S.atkL * 0.02) * (buffActive('kiai') ? 1.6 : 1));
export const maxHp = () => Math.floor(100 + S.lvl * 12 + S.hpL * 22 + sum('hp'));
export const critCh = () => Math.min(0.9, 0.05 + curW().crit + sum('crit') + (buffActive('hawk') ? 0.4 : 0));
export const goldMul = () => 1 + sum('gold');
export const cdMul = () => Math.max(0.45, 1 - S.spdL * 0.04);
export const xpNeed = () => Math.floor(20 * Math.pow(1.22, S.lvl - 1));
export const power = () => Math.floor((atk() * 10 + maxHp()) * (1 + critCh()));

/* economy */
export type TrainKey = 'atk' | 'hp' | 'spd';
export const COST: Record<TrainKey, (l: number) => number> = {
  atk: l => Math.floor(10 * Math.pow(1.15, l)),
  hp: l => Math.floor(8 * Math.pow(1.14, l)),
  spd: l => Math.floor(30 * Math.pow(1.32, l)),
};
export const MAXL: Record<TrainKey, number> = { atk: 1e9, hp: 1e9, spd: 14 };
export const lvlOf = (k: TrainKey) => S[(k + 'L') as 'atkL' | 'hpL' | 'spdL'];
/** levels and total cost for the current buy multiplier (bm 0 means as many as affordable) */
export function bulk(k: TrainKey) {
  const l0 = lvlOf(k); let n = 0, c = 0; const lim = S.bm || Infinity;
  while (n < lim && l0 + n < MAXL[k]) { const nc = COST[k](l0 + n); if (!S.bm && c + nc > S.gold) break; c += nc; n++; }
  if (n === 0 && l0 < MAXL[k]) { n = 1; c = COST[k](l0); }
  return { n, c };
}
export const skCost = (l: number) => ({ gold: Math.floor(150 * Math.pow(1.6, l)), soul: 2 + l * 2 });
export const skF = (i: number) => 1 + 0.25 * (S.skL[i] || 0);

/* quests */
export function quest(): Quest {
  if (S.q < QUESTS.length) return QUESTS[S.q];
  const j = S.q - QUESTS.length, t = j % 3;
  if (t === 0) return { k: 'kill', n: 40 + j * 10, txt: 'Победи ' + (40 + j * 10) + ' ёкаев' };
  if (t === 1) return { k: 'skill', n: 15 + j * 3, txt: 'Используй навыки ' + (15 + j * 3) + ' раз' };
  const n = 1 + Math.floor(j / 6);
  return { k: 'boss', n, txt: 'Победи боссов: ' + n };
}
export function qProg(q: Quest) { if (q.k === 'atk') return S.atkL; if (q.k === 'hp') return S.hpL; if (q.k === 'stage') return S.best; return S.qp; }
export const qReward = () => ({ gold: Math.ceil(40 * Math.pow(1.17, S.best - 1) * (1 + S.q * 0.15)), soul: 1 + Math.floor(S.q / 3) });
export function qTick(k: Quest['k'], n = 1) { if (quest().k === k) S.qp += n; }

export function equip(it: Item) {
  const old = S.eq[it.slot];
  S.inv = S.inv.filter(x => x.id !== it.id);
  if (old) S.inv.push(old);
  S.eq[it.slot] = it;
  S.hp = Math.min(S.hp, maxHp());
  if (it.slot !== 'weapon') qTick('equip');
  save();
}
