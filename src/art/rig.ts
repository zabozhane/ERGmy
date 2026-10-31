// Cut-out hero rig: painted body parts and gear from public/rig, posed by code.
// Angles are degrees, forward-positive: limbs 0 = hanging down, 90 = pointing forward, 180 = up.
// Arms are relative to the torso, forearms and shins to their parent; weapons are world angles.
import { RC, type Gender, type WeaponType } from '../data';
import type { Item, Save } from '../state';

type Ctx = CanvasRenderingContext2D;
type Img = HTMLImageElement | HTMLCanvasElement;
/** w, h: drawn size at scale 1; top, bot: x of the joint at the top / bottom edge, 0..1 of the width */
interface Meta { w: number; h: number; top: number; bot: number }

const BODY = ['head', 'torso', 'coat', 'upper_arm', 'forearm', 'thigh', 'shin', 'saya', 'hair'];
const SHARED = ['eq_helm', 'eq_armor', 'eq_arms', 'eq_legs', 'eq_charm', 'w_katana', 'w_naginata', 'w_yumi', 'w_shuriken', 'fx_slash', 'fx_slash_gold', 'fx_petals'];
const WEAPON: Record<WeaponType, string> = { katana: 'w_katana', nagi: 'w_naginata', yumi: 'w_yumi', shur: 'w_shuriken' };
/** where the hand holds each weapon, 0..1 along the image width */
const GRIP: Record<WeaponType, number> = { katana: 0.1, nagi: 0.38, yumi: 0.5, shur: 0.5 };

const parts: Record<string, Img> = {};
let meta: Record<string, Meta> = {};
const base = import.meta.env.BASE_URL + 'rig/';
const load = (key: string) => new Promise<void>(done => {
  const im = new Image(); im.onload = () => { parts[key] = im; done(); }; im.onerror = () => done(); im.src = base + key + '.png';
});
export const rigReady = fetch(base + 'rig.json').then(r => r.ok ? r.json() : {}).catch(() => ({})).then((m: Record<string, Meta>) => {
  meta = m;
  return Promise.all(Object.keys(m).filter(k => BODY.some(b => k.endsWith('/' + b)) || SHARED.includes(k)).map(load));
});
export const hasRig = (g: Gender) => ['head', 'torso', 'upper_arm', 'forearm', 'thigh', 'shin'].every(p => parts[g + '/' + p]);

// darkened copies for the far limbs and gear tinted to the rarity colour, baked once
const baked: Record<string, HTMLCanvasElement> = {};
function bake(key: string, tint: string | null, dark: boolean): Img | undefined {
  const im = parts[key]; if (!im) return undefined;
  if (!tint && !dark) return im;
  const id = key + '|' + tint + '|' + dark; if (baked[id]) return baked[id];
  const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
  const c = cv.getContext('2d')!; c.drawImage(im, 0, 0);
  if (tint) {
    c.globalCompositeOperation = 'multiply'; c.fillStyle = tint; c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.35; c.drawImage(im, 0, 0); c.globalAlpha = 1;
  }
  if (dark) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(8,8,14,.45)'; c.fillRect(0, 0, cv.width, cv.height); }
  c.globalCompositeOperation = 'destination-in'; c.drawImage(im, 0, 0);
  return baked[id] = cv;
}

/** draws a part hanging from its top joint (pivot 'top') or standing on its bottom joint ('bot'); ov: px past the joint */
function part(c: Ctx, key: string, pivot: 'top' | 'bot', ov: number, o: { tint?: string | null; dark?: boolean; glow?: string } = {}) {
  const m = meta[key], im = bake(key, o.tint || null, !!o.dark); if (!m || !im) return;
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 10; }
  if (pivot === 'top') c.drawImage(im, -m.top * m.w, -ov, m.w, m.h);
  else c.drawImage(im, -m.bot * m.w, ov - m.h, m.w, m.h);
  if (o.glow) c.shadowBlur = 0;
}

export interface Pose {
  lean: number; head: number; bob: number; dx: number; spin: number; coat: number;
  thF: number; shF: number; thB: number; shB: number; uaF: number; faF: number; uaB: number; faB: number; wpn: number;
}
type Key = [number, Partial<Pose>];
const R = Math.PI / 180;

// skeleton, px at scale 1, feet on y = 0
const HIP = -50, THIGH = 24, SHIN = 26, NECK = -32, SHOULDER = -27, UARM = 21, FARM = 20;

function basePose(t: number, run: boolean, wt: WeaponType): Pose {
  const bow = wt === 'yumi', two = wt === 'nagi';
  if (run) {
    const ph = t * 13, s = Math.sin(ph), cs = Math.cos(ph);
    return { lean: 7, head: -5, bob: -Math.abs(s) * 2.5, dx: 0, spin: 0, coat: -10 - 6 * Math.abs(s),
      thF: 30 * s, shF: -8 - 38 * Math.max(0, cs), thB: -30 * s, shB: -8 - 38 * Math.max(0, -cs),
      uaF: bow ? 70 : two ? 45 : 25 - 8 * s, faF: bow ? 10 : two ? 40 : 45, uaB: bow ? 20 * s : two ? 55 : 24 * s, faB: bow ? 25 : two ? 50 : 25,
      wpn: bow ? 90 : two ? 125 : wt === 'shur' ? 90 : 125 };
  }
  const br = Math.sin(t * 2);
  return { lean: 2, head: br, bob: br * 0.6, dx: 0, spin: 0, coat: -2,
    thF: 7, shF: -5, thB: -7, shB: -3,
    uaF: bow ? 80 : two ? 35 : 18, faF: bow ? 5 : two ? 35 : 50, uaB: bow ? 70 : two ? 50 : -6, faB: bow ? 70 : two ? 50 : 15,
    wpn: bow ? 90 : two ? 135 : wt === 'shur' ? 80 : 128 };
}

const crouch: Partial<Pose> = { bob: 12, lean: 22, thF: 65, shF: -100, thB: -15, shB: -95 };
/** moves: keyframes over progress 0..1; {} at the ends means the base pose, so a move eases in and out */
export const MOVES: Record<string, { dur: number; keys: Key[] }> = {
  katana: { dur: 0.25, keys: [[0, {}], [0.12, { uaF: 165, faF: 25, wpn: 205, lean: -5 }], [0.38, { uaF: 75, faF: 0, wpn: 85, lean: 15, thF: 30, shF: -25 }], [1, {}]] },
  nagi: { dur: 0.25, keys: [[0, {}], [0.15, { uaF: 150, faF: 30, uaB: 140, wpn: 195, lean: -8 }], [0.45, { uaF: 45, faF: 10, uaB: 40, wpn: 40, lean: 16, thF: 30 }], [1, {}]] },
  yumi: { dur: 0.25, keys: [[0, {}], [0.1, { faB: 150, uaB: 85 }], [0.3, { faB: 30, uaB: 60 }], [1, {}]] },
  shur: { dur: 0.25, keys: [[0, {}], [0.15, { uaF: -35, faF: 70, lean: -6 }], [0.4, { uaF: 110, faF: 0, lean: 10 }], [1, {}]] },
  iai: { dur: 0.6, keys: [[0, {}], [0.25, { ...crouch, uaF: 5, faF: 95, wpn: 265 }], [0.45, { dx: 34, lean: 28, uaF: 100, faF: 0, wpn: 95, thF: 55, shF: -20, thB: -40, shB: -10 }], [0.75, { dx: 20, lean: 12, uaF: 95, faF: 5, wpn: 100 }], [1, {}]] },
  petal: { dur: 0.6, keys: [[0, {}], [0.12, { uaF: 160, wpn: 200 }], [0.25, { uaF: 60, wpn: 70, lean: 14 }], [0.4, { uaF: 140, wpn: 170, spin: 0.5 }], [0.55, { uaF: 50, wpn: 60, lean: 14, spin: 1 }], [0.7, { uaF: 165, wpn: 210 }], [0.85, { uaF: 70, wpn: 80, lean: 16 }], [1, {}]] },
  kiai: { dur: 0.8, keys: [[0, {}], [0.25, { uaF: 170, faF: 10, uaB: 150, faB: 20, wpn: 180, lean: -10, head: -18, thF: 20, thB: -20 }], [0.8, { uaF: 170, faF: 10, uaB: 150, faB: 20, wpn: 180, lean: -10, head: -18, thF: 20, thB: -20 }], [1, {}]] },
  whirl: { dur: 0.6, keys: [[0, {}], [0.1, { uaF: 95, faF: 0, uaB: 90, wpn: 90, lean: 5 }], [0.8, { uaF: 95, faF: 0, uaB: 90, wpn: 90, lean: 5, spin: 1 }], [1, { spin: 1 }]] },
  quake: { dur: 0.7, keys: [[0, {}], [0.3, { bob: -26, uaF: 170, uaB: 160, wpn: 190, thF: 45, shF: -70, thB: -15, shB: -70, lean: -6 }], [0.5, { bob: 6, uaF: 60, uaB: 50, wpn: 60, lean: 26, thF: 40, shF: -80, thB: -35, shB: -25 }], [0.8, { bob: 6, uaF: 60, uaB: 50, wpn: 60, lean: 24, thF: 40, shF: -80, thB: -35, shB: -25 }], [1, {}]] },
  will: { dur: 0.9, keys: [[0, {}], [0.3, { uaF: 40, faF: 105, uaB: 40, faB: 105, head: 12, lean: -2, wpn: 175 }], [0.8, { uaF: 40, faF: 105, uaB: 40, faB: 105, head: 12, lean: -2, wpn: 175 }], [1, {}]] },
  pierce: { dur: 0.6, keys: [[0, {}], [0.5, { faB: 165, uaB: 88, lean: -6, thF: 20, thB: -20 }], [0.6, { faB: 30, uaB: 60, lean: 4 }], [1, {}]] },
  rain: { dur: 0.6, keys: [[0, {}], [0.4, { uaF: 125, wpn: 140, uaB: 115, faB: 150, lean: -14, head: -25 }], [0.55, { uaF: 125, wpn: 140, uaB: 100, faB: 40, lean: -10, head: -25 }], [1, {}]] },
  hawk: { dur: 0.8, keys: [[0, {}], [0.3, { head: -10, uaB: 150, faB: 30, lean: -6 }], [0.8, { head: -10, uaB: 150, faB: 30, lean: -6 }], [1, {}]] },
  fan: { dur: 0.5, keys: [[0, {}], [0.15, { uaF: -40, faF: 70, uaB: 120 }], [0.35, { uaF: 115, faF: 0, uaB: -30, lean: 12 }], [0.5, { uaF: -20, uaB: 130 }], [0.7, { uaF: 110, faF: 0, uaB: -20, lean: 12 }], [1, {}]] },
  smoke: { dur: 0.6, keys: [[0, {}], [0.3, { ...crouch, uaF: 90, faF: 40 }], [0.7, { ...crouch, uaF: 90, faF: 40 }], [1, {}]] },
  clone: { dur: 0.7, keys: [[0, {}], [0.3, { uaF: 120, faF: 90, uaB: 110, faB: 90, head: -5 }], [0.7, { uaF: 120, faF: 90, uaB: 110, faB: 90, head: -5 }], [1, {}]] },
};

const ease = (x: number) => x * x * (3 - 2 * x);
export function pose(t: number, run: boolean, wt: WeaponType, move: string | undefined, p: number): Pose {
  const b = basePose(t, run, wt), mv = move && MOVES[move];
  if (!mv || p <= 0 || p >= 1) return b;
  let i = 0; while (i < mv.keys.length - 2 && mv.keys[i + 1][0] < p) i++;
  const [p0, k0] = mv.keys[i], [p1, k1] = mv.keys[i + 1], f = ease(Math.min(1, Math.max(0, (p - p0) / (p1 - p0 || 1))));
  const out = { ...b } as Pose;
  (Object.keys(b) as (keyof Pose)[]).forEach(k => { const a = k0[k] ?? b[k], z = k1[k] ?? b[k]; out[k] = a + (z - a) * f; });
  return out;
}

export interface RigOpts { g: Gender; t: number; run: boolean; wt: WeaponType; move?: string; p: number; smoke?: boolean }

/** Draws the rigged hero with feet at the origin. Returns false while the rig is not loaded. */
export function drawRig(c: Ctx, eq: Save['eq'], o: RigOpts) {
  const g = o.g; if (!hasRig(g)) return false;
  const P = pose(o.t, o.run, o.wt, o.move, o.p), K = (n: string) => g + '/' + n;
  const gear = (it: Item | undefined) => it ? { tint: RC[it.r], glow: it.r >= 4 ? RC[it.r] : undefined } : null;
  const Hm = gear(eq.helm), A = gear(eq.armor), Ar = gear(eq.arms), L = gear(eq.legs), Ch = gear(eq.charm), Wp = eq.weapon;
  const wt = Wp ? Wp.wt! : o.wt, weapon = WEAPON[wt];

  c.save();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(4 + P.dx, 1, 26, 4, 0, 0, 7); c.fill();
  c.translate(P.dx, HIP + P.bob);
  const sx = Math.cos(P.spin * Math.PI * 2); c.scale(Math.abs(sx) < 0.15 ? Math.sign(sx || 1) * 0.15 : sx, 1);

  const leg = (th: number, sh: number, dark: boolean, x: number) => {
    c.save(); c.translate(x, 0); c.rotate(-th * R); part(c, K('thigh'), 'top', 4, { dark });
    c.translate(0, THIGH); c.rotate(-sh * R); part(c, K('shin'), 'top', 4, { dark });
    if (L) part(c, 'eq_legs', 'top', -4, { ...L, dark });
    c.restore();
  };
  // weapon at a world angle, drawn from inside the forearm frame (acc: canvas rotation so far, degrees)
  const hand = (acc: number) => {
    const m = meta[weapon], im = parts[weapon]; if (!m || !im) return;
    c.save(); c.translate(0, FARM);
    if (wt === 'yumi') {
      c.rotate((90 - P.wpn - acc) * R);
      const pull = Math.max(0, Math.min(1, (P.faB - 40) / 110)) * 24;
      c.strokeStyle = '#d8d2c2'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-m.w * 0.42, -m.h / 2 + 2); c.lineTo(-m.w * 0.42 - pull, 0); c.lineTo(-m.w * 0.42, m.h / 2 - 2); c.stroke();
      if (pull > 4) { c.strokeStyle = '#efe7d4'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-m.w * 0.42 - pull, 0); c.lineTo(-m.w * 0.42 - pull + 40, 0); c.stroke(); }
      c.drawImage(bake(weapon, null, false)!, -m.w / 2, -m.h / 2, m.w, m.h);
    } else {
      c.rotate((90 - P.wpn - acc) * R);
      if (Wp && Wp.r >= 2) { c.shadowColor = RC[Wp.r]; c.shadowBlur = 6 + Wp.r * 3; }
      c.drawImage(im, -GRIP[wt] * m.w, -m.h / 2, m.w, m.h); c.shadowBlur = 0;
    }
    c.restore();
  };
  const arm = (ua: number, fa: number, dark: boolean, x: number, holds: boolean) => {
    c.save(); c.translate(x, SHOULDER); c.rotate(-ua * R); part(c, K('upper_arm'), 'top', 4, { dark });
    c.translate(0, UARM); c.rotate(-fa * R);
    if (holds) hand(P.lean - ua - fa);
    part(c, K('forearm'), 'top', 3, { dark });
    if (Ar) part(c, 'eq_arms', 'top', 0, { ...Ar, dark });
    c.restore();
  };

  if (parts[K('hair')]) { c.save(); c.rotate(P.lean * R); c.translate(-3, NECK - 8); c.rotate((-P.lean * 0.5 + (o.run ? 14 : 4) + Math.sin(o.t * 3) * 3) * R); part(c, K('hair'), 'top', 0); c.restore(); }
  c.save(); c.rotate(P.lean * R); arm(P.uaB, P.faB, true, -2, wt === 'nagi'); c.restore();
  leg(P.thB, P.shB, true, -2);
  leg(P.thF, P.shF, false, 2);
  c.save(); c.rotate(P.lean * R);
  if (parts[K('coat')]) { c.save(); c.translate(0, -4); c.rotate((-P.lean * 0.7 - P.coat) * R); part(c, K('coat'), 'top', 0); c.restore(); }
  part(c, K('torso'), 'bot', 4);
  if (A) part(c, 'eq_armor', 'bot', 10, A);
  if (g === 'm' && parts[K('saya')]) { const m = meta[K('saya')]; c.save(); c.translate(-2, -4); c.rotate(-20 * R); c.drawImage(parts[K('saya')], -m.w * 0.72, -m.h / 2, m.w, m.h); c.restore(); }
  if (Ch) { c.save(); c.translate(7, -2); part(c, 'eq_charm', 'top', 0, Ch); c.restore(); }
  c.save(); c.translate(1, NECK); c.rotate(P.head * R); part(c, K('head'), 'bot', 3);
  if (Hm) { c.translate(0, -12); part(c, 'eq_helm', 'bot', 6, Hm); }
  c.restore();
  arm(P.uaF, P.faF, false, 1, true);
  c.restore();

  if (o.smoke) { c.fillStyle = 'rgba(160,166,192,.35)'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill(); }
  c.restore();
  return true;
}

/** painted slash and petal effects; false when not loaded so the caller keeps its own arc */
export function drawFx(c: Ctx, name: 'fx_slash' | 'fx_slash_gold' | 'fx_petals', x: number, y: number, size: number, t: number, rot = 0) {
  const im = parts[name], m = meta[name]; if (!im || !m) return false;
  const h = size * m.h / m.w;
  c.save(); c.globalAlpha = Math.max(0, Math.min(1, t * 1.6)); c.translate(x, y); c.rotate(rot);
  c.scale(1 + (1 - t) * 0.25, 1 + (1 - t) * 0.25); c.drawImage(im, -size / 2, -h / 2, size, h); c.restore();
  return true;
}
