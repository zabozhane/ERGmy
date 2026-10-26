// Dev page (rig.html): every move of the hero rig sampled over time, for tuning joints and keyframes.
import { MOVES, drawRig, rigReady } from './rig';
import type { Gender, WeaponType } from '../data';
import type { Item, Save } from '../state';

const q = new URLSearchParams(location.search);
const g = (q.get('g') || 'm') as Gender, r = Number(q.get('r') ?? -1), Z = Number(q.get('z') || 2);
const WT: Record<string, WeaponType> = { katana: 'katana', iai: 'katana', petal: 'katana', kiai: 'katana', nagi: 'nagi', whirl: 'nagi', quake: 'nagi', will: 'nagi',
  yumi: 'yumi', pierce: 'yumi', rain: 'yumi', hawk: 'yumi', shur: 'shur', fan: 'shur', smoke: 'shur', clone: 'shur' };
const it = (slot: Item['slot']) => ({ id: 0, slot, r, lvl: 1, atk: 0, hp: 0 }) as unknown as Item;
const eq: Save['eq'] = r >= 0 ? { helm: it('helm'), armor: it('armor'), arms: it('arms'), legs: it('legs'), charm: it('charm') } : {};
const P = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 0.95];
const rows: [string, (c: CanvasRenderingContext2D, i: number) => void][] = [
  ['idle / run', (c, i) => drawRig(c, eq, { g, t: i * 0.06, run: i > 0, wt: 'katana', p: 0 })],
  ...Object.keys(MOVES).map(m => [m, (c: CanvasRenderingContext2D, i: number) => drawRig(c, eq, { g, t: 0, run: false, wt: WT[m], move: m, p: P[i] })] as [string, (c: CanvasRenderingContext2D, i: number) => void]),
];
rigReady.then(() => {
  const cv = document.getElementById('c') as HTMLCanvasElement, cw = 120, ch = 150;
  cv.width = (P.length * cw + 80) * Z; cv.height = rows.length * ch * Z;
  const c = cv.getContext('2d')!; c.scale(Z, Z);
  rows.forEach(([name, fn], y) => {
    c.fillStyle = y % 2 ? '#1d2440' : '#222a4a'; c.fillRect(0, y * ch, cv.width, ch);
    c.fillStyle = '#efe7d4'; c.fillText(name, 6, y * ch + 16);
    P.forEach((_, i) => { c.save(); c.translate(80 + i * cw + 50, y * ch + ch - 14); fn(c, i); c.restore(); });
  });
});
