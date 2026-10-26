// Painted sprites from public/sprites, generated from visual/prompts.md.
// Any kind without a sprite (or before it loads) falls back to the procedural art.
type Ctx = CanvasRenderingContext2D;

/** h: drawn height in foe radii (heroes: in px at scale 1); dy: lift of the sprite bottom above the feet, in the same units */
const DEFS: Record<string, { h: number; dy?: number }> = {
  hero_m: { h: 112 }, hero_f: { h: 108 },
  kappa: { h: 2.3 }, tanuki: { h: 2.8 }, ashigaru: { h: 3.3 }, yurei: { h: 2.7 },
  skull: { h: 2.4, dy: 0.2 }, onibi: { h: 2.4, dy: 0.1 },
  oni: { h: 3 }, necro: { h: 3.3 },
};

const imgs: Record<string, HTMLImageElement> = {};
export const spritesReady = Promise.all(Object.keys(DEFS).map(name => new Promise<void>(done => {
  const im = new Image();
  im.onload = () => { imgs[name] = im; done(); };
  im.onerror = () => done();
  im.src = import.meta.env.BASE_URL + 'sprites/' + name + '.png';
})));

export const hasSprite = (name: string) => !!imgs[name];

/**
 * Draws a sprite with its feet at the current origin. `unit` turns DEFS sizes into px
 * (the foe radius, or 1 for heroes); `breath` and `lean` give static art a little life.
 */
export function drawSprite(c: Ctx, name: string, unit: number, o: { breath?: number; lean?: number; grey?: boolean } = {}) {
  const im = imgs[name], d = DEFS[name]; if (!im) return false;
  const h = d.h * unit, w = h * im.width / im.height, sy = 1 + (o.breath || 0) * 0.02;
  c.save(); c.translate(0, -(d.dy || 0) * unit); c.rotate(o.lean || 0); c.scale(1 / Math.sqrt(sy), sy);
  if (o.grey) c.filter = 'grayscale(1) contrast(1.1)';
  c.drawImage(im, -w / 2, -h, w, h);
  c.restore();
  return true;
}
