// DOM interface: top bar, quest, skills bar, tabs (growth, gear, skills, scroll) and hero/class picker.
import { CLASSES, HERO, RC, RM, RN, SLOTS, type Gender, type SlotId } from '../data';
import { ACTS, ACT_STAGES } from '../acts';
import {
  S, atk, bulk, cls, critCh, cdMul, equip, fmt, genItem, goldMul, isUpgrade, itemKj, itemName, lvlOf, MAXL, maxHp,
  here, power, qProg, qReward, quest, resetSave, save, score, sellVal, skCost, skF, stageLabel, xpNeed, type Item, type TrainKey,
} from '../state';
import { battle, castSkill, resetBattle, skillCd } from '../game/battle';
import { drawHero, portraitBg } from '../art/hero';
import { spritesReady } from '../art/sprites';
import { rigReady } from '../art/rig';

const artReady = Promise.all([spritesReady, rigReady]);
import { on } from '../events';

const $ = (id: string) => document.getElementById(id)!;
const $b = (id: string) => document.getElementById(id) as HTMLButtonElement | null;

type Tab = 'grow' | 'gear' | 'skill' | 'scroll';
const TABS: Record<Tab, string> = { grow: 'Рост', gear: 'Снаряжение', skill: 'Навыки', scroll: 'Свиток' };
let tab: Tab = 'grow', sel: number | null = null;

export function toast(txt: string, col: string, sub?: string) {
  const d = document.createElement('div'); d.className = 'toast'; d.style.color = col;
  d.innerHTML = (sub ? '<b>' + sub + '</b> ' : '') + '<span></span>'; d.querySelector('span')!.textContent = txt;
  const box = $('toasts'); box.prepend(d);
  while (box.children.length > 3) box.lastChild!.remove();
  setTimeout(() => d.remove(), 3500);
}

function renderQuest() {
  const q = quest(), p = Math.min(q.n, qProg(q)), done = p >= q.n, r = qReward(), b = $('quest') as HTMLButtonElement;
  b.className = 'quest' + (done ? ' done' : '');
  b.innerHTML = '<span class="kj">任</span><span>' + q.txt + '<small>' + (done ? 'Забрать: +' + fmt(r.gold) + ' 金 +' + r.soul + ' 魂' : p + '/' + q.n + ' · награда ' + fmt(r.gold) + ' 金') + '</small></span>';
  b.disabled = !done;
}
function claimQuest() {
  const q = quest(); if (qProg(q) < q.n) return;
  const r = qReward(); S.gold += r.gold; S.soul += r.soul; S.q++; S.qp = 0;
  toast('Задание выполнено +' + fmt(r.gold) + ' 金', '#e3b456'); save(); renderTop(); renderPanel();
}

export function renderTop() {
  const sp = $('spill');
  const tier = battle.tier === 'act' ? 'БОСС' : battle.tier === 'mini' ? 'СТРАЖ' : 'ВОЖАК';
  sp.innerHTML = '<span>' + here().zone.name + '</span><b>' + stageLabel(S.stage) + '</b>' +
    (S.bossFail ? '<button class="rbtn" id="retry">Босс</button>' : '<span class="prog">' + (battle.bossOn ? tier : Math.min(10, S.kills) + '/10') + '</span>');
  const rb = $b('retry'); if (rb) rb.onclick = () => { S.bossFail = false; S.kills = 10; resetBattle(); renderTop(); };
  $('nm').textContent = S.g ? HERO[S.g].name + ' · ' + cls().name : 'Ронин';
  drawAva(); hud();
}
export function hud() {
  $('lv').textContent = 'Ур. ' + S.lvl; $('gold').textContent = fmt(S.gold); $('soul').textContent = fmt(S.soul); $('pow').textContent = fmt(power());
  ($('xpbar') as HTMLElement).style.width = (S.xp / xpNeed() * 100) + '%';
  const hb = document.getElementById('hpb'); if (hb) hb.style.width = Math.max(0, S.hp / maxHp() * 100) + '%';
  const ht = document.getElementById('hpt'); if (ht) ht.textContent = fmt(Math.max(0, S.hp)) + '/' + fmt(maxHp());
  renderQuest();
  if (tab === 'grow') (['atk', 'hp', 'spd'] as TrainKey[]).forEach(k => {
    const b = $b('buy-' + k); if (!b) return;
    const mx = lvlOf(k) >= MAXL[k], { n, c } = bulk(k);
    b.disabled = mx || S.gold < c; b.innerHTML = mx ? 'макс.' : fmt(c) + ' 金<small>+' + n + ' ур.</small>';
  });
  updateDots();
}
function drawAva() {
  const c = ($('ava') as HTMLCanvasElement).getContext('2d')!; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 96, 96);
  if (!S.g) { c.fillStyle = '#232b47'; c.fillRect(0, 0, 96, 96); return; }
  portraitBg(c, 96, 96, S.g); drawHero(c, 46, 236, 2.2, S.eq, { g: S.g, t: 0, run: false, anim: 0, wt: cls().w });
}

export function renderSkills() {
  const el = $('skbar'); el.innerHTML = '';
  const a = document.createElement('button'); a.className = 'auto'; a.id = 'auto'; a.innerHTML = 'АВТО<br>' + (S.auto ? 'ВКЛ' : 'ВЫКЛ');
  a.setAttribute('aria-pressed', String(S.auto)); a.onclick = () => { S.auto = !S.auto; renderSkills(); save(); }; el.appendChild(a);
  cls().skills.forEach((sk, i) => {
    const b = document.createElement('button'), lock = S.lvl < sk.lvl;
    b.className = 'sk' + (lock ? ' locked' : ''); b.id = 'sk-' + i;
    b.setAttribute('aria-label', sk.name + (lock ? ', откроется на ' + sk.lvl + ' ур.' : ''));
    b.innerHTML = '<span class="cd"></span><span class="kj">' + sk.kj + '</span><span class="lv">' + (lock ? sk.lvl + ' ур.' : '+' + (S.skL[i] || 0)) + '</span>';
    b.onclick = () => castSkill(i); el.appendChild(b);
  });
  const sp = document.createElement('span'); sp.className = 'sp'; el.appendChild(sp);
  const hp = document.createElement('div'); hp.className = 'hpwrap'; hp.innerHTML = '<span>Здоровье</span><div class="hpbar"><i id="hpb"></i></div><span id="hpt"></span>'; el.appendChild(hp);
}
export function updateSkillUI() {
  cls().skills.forEach((sk, i) => { const b = document.getElementById('sk-' + i); if (b) (b.querySelector('.cd') as HTMLElement).style.height = (skillCd[i] / sk.cd * 100) + '%'; });
}

function setDot(id: string, n: number) {
  const b = $(id); let d = b.querySelector('.dot');
  if (n > 0) { if (!d) { d = document.createElement('span'); d.className = 'dot'; b.appendChild(d); } d.textContent = String(n); }
  else if (d) d.remove();
}
function updateDots() {
  setDot('tab-gear', S.inv.filter(isUpgrade).length);
  setDot('tab-skill', cls().skills.filter((sk, i) => { const c = skCost(S.skL[i] || 0); return S.lvl >= sk.lvl && S.gold >= c.gold && S.soul >= c.soul; }).length);
}

export function setTab(t: Tab) {
  tab = t; sel = null;
  (Object.keys(TABS) as Tab[]).forEach(x => $('tab-' + x).setAttribute('aria-selected', String(x === t)));
  renderPanel(); $('pbody').scrollTop = 0;
  try { localStorage.setItem('yomi-tab', t); } catch { /* storage blocked */ }
}
export function renderPanel() {
  $('ptitle').textContent = TABS[tab]; $('ptools').innerHTML = '';
  if (tab === 'grow') renderGrow(); else if (tab === 'gear') renderGear(); else if (tab === 'skill') renderSkillTab(); else renderScroll();
  hud();
}

function renderGrow() {
  $('ptools').innerHTML = '<div class="mult">' + [1, 10, 100, 0].map(m => '<button id="bm-' + m + '" aria-pressed="' + (S.bm === m) + '">' + (m ? '×' + m : 'MAX') + '</button>').join('') + '</div>';
  [1, 10, 100, 0].forEach(m => { $b('bm-' + m)!.onclick = () => { S.bm = m; save(); renderPanel(); }; });
  const rows: [TrainKey, string, string, string][] = [
    ['atk', '力', 'Атака', 'сейчас ' + fmt(atk())], ['hp', '命', 'Здоровье', 'сейчас ' + fmt(maxHp())], ['spd', '速', 'Скорость удара', 'перезарядка ×' + cdMul().toFixed(2)]];
  $('pbody').innerHTML = '<span class="lbl">Тренировка за золото</span>' + rows.map(r =>
    `<div class="row"><span class="ic">${r[1]}</span><div class="txt">${r[2]} <span class="mono" style="color:var(--gold-hi)">ур. ${lvlOf(r[0])}</span><small class="val">${r[3]}</small></div><button class="gbtn buy" id="buy-${r[0]}"></button></div>`).join('')
    + `<span class="lbl">Характеристики</span><div class="stats"><div><b>${Math.round(critCh() * 100)}%</b><small>Крит</small></div><div><b>×2.2</b><small>Урон крита</small></div><div><b>×${goldMul().toFixed(2)}</b><small>Золото</small></div><div><b>${stageLabel(S.best)}</b><small>Рекорд</small></div></div>`;
  (['atk', 'hp', 'spd'] as TrainKey[]).forEach(k => {
    $b('buy-' + k)!.onclick = () => {
      const { n, c } = bulk(k); if (n <= 0 || S.gold < c) return;
      S.gold -= c; (S as any)[k + 'L'] += n; if (k === 'hp') S.hp += 22 * n; save(); renderPanel(); renderTop();
    };
  });
}

const slotName = (id: SlotId) => SLOTS.find(s => s.id === id)!.name;
function slotBtn(s: typeof SLOTS[number]) {
  const it = S.eq[s.id];
  return `<button class="slot${it ? '' : ' empty'}" id="slot-${s.id}" style="${it ? 'border-color:' + RC[it.r] : ''}" aria-label="${s.name}${it ? ': ' + itemName(it) : ' пусто'}"><span class="kj" style="color:${it ? RC[it.r] : 'var(--mist)'}">${it ? itemKj(it) : s.kj}</span><em>${s.name}</em></button>`;
}
function statLine(it: Item) {
  const a: string[] = [];
  if (it.atk) a.push('Атака +' + fmt(it.atk)); if (it.hp) a.push('Здоровье +' + fmt(it.hp));
  if (it.crit) a.push('Крит +' + (it.crit * 100).toFixed(1) + '%'); if (it.gold) a.push('Золото +' + Math.round(it.gold * 100) + '%');
  return a;
}
function cmpLine(it: Item) {
  const cur: Partial<Item> = S.eq[it.slot] || {}; const out: string[] = [];
  const d = (k: 'atk' | 'hp' | 'crit' | 'gold', lab: string, f: (v: number) => string) => {
    const v = (it[k] || 0) - (cur[k] || 0);
    if (Math.abs(v) > 1e-9) out.push('<span class="' + (v > 0 ? 'plus' : 'minus') + '">' + lab + ' ' + (v > 0 ? '+' : '−') + f(Math.abs(v)) + '</span>');
  };
  d('atk', 'Атака', fmt); d('hp', 'Здоровье', fmt); d('crit', 'Крит', v => (v * 100).toFixed(1) + '%'); d('gold', 'Золото', v => Math.round(v * 100) + '%');
  return out.join('') || '<span>Без изменений</span>';
}
function renderGear() {
  $('ptools').innerHTML = '<button class="gbtn" id="best" style="min-height:0;padding:4px 10px;font-size:.75rem">Надеть лучшее</button>';
  const inv = S.inv.slice().sort((a, b) => b.r - a.r || score(b) - score(a));
  const eqd = Object.values(S.eq).filter(Boolean) as Item[];
  const it = sel != null ? (S.inv.find(i => i.id === sel) || eqd.find(i => i.id === sel)) : undefined;
  const equipped = !!it && S.eq[it.slot]?.id === it.id;
  $('pbody').innerHTML = `
  <div class="doll"><div class="col">${SLOTS.slice(0, 3).map(slotBtn).join('')}</div><canvas id="doll" aria-label="Внешний вид героя"></canvas><div class="col">${SLOTS.slice(3).map(slotBtn).join('')}</div></div>
  <div class="stats"><div><b>${fmt(atk())}</b><small>Атака</small></div><div><b>${fmt(maxHp())}</b><small>HP</small></div><div><b>${Math.round(critCh() * 100)}%</b><small>Крит</small></div><div><b>${fmt(power())}</b><small>Мощь</small></div></div>
  ${it ? `<div class="detail" style="border-color:${RC[it.r]}"><span class="lbl" style="color:${RC[it.r]}">${RN[it.r]} · ${slotName(it.slot)} · этап ${stageLabel(it.lv)}</span><h3>${itemName(it)}</h3>
    <div class="cmp">${statLine(it).map(s => '<span>' + s + '</span>').join('')}</div>
    ${equipped ? '' : '<div class="cmp"><span class="lbl">Против надетого</span>' + cmpLine(it) + '</div>'}
    <div class="btns">${equipped ? '<button id="unequip">Снять</button>' : '<button class="gbtn" id="equip">Надеть</button><button id="sell">Продать · ' + fmt(sellVal(it)) + ' 金</button>'}</div></div>` : ''}
  <div class="row" style="justify-content:space-between"><span class="lbl">Сумка · ${S.inv.length}/42</span><button id="sellworse" style="min-height:0;padding:4px 10px;font-size:.75rem">Продать хуже надетого</button></div>
  ${inv.length ? `<div class="inv">${inv.map(i => `<button class="it" id="it-${i.id}" style="color:${RC[i.r]}" aria-pressed="${sel === i.id}" aria-label="${itemName(i)}, ${RN[i.r]}"><span class="kj">${itemKj(i)}</span>${isUpgrade(i) ? '<span class="up">▲</span>' : ''}</button>`).join('')}</div>`
    : '<p class="empty-note">Пусто. Вещи падают примерно с каждого восьмого ёкая, с босса всегда редкая или лучше.</p>'}
  <span class="lbl">Герой</span>
  <div class="row"><span class="ic">${S.g === 'f' ? '女' : '男'}</span><div class="txt">${S.g ? HERO[S.g].name : '—'}<small>${S.g ? HERO[S.g].desc : ''}</small></div><button id="chg">Сменить</button></div>
  <div class="row"><span class="ic">${cls().kj}</span><div class="txt">${cls().name}<small>${cls().desc}</small></div><button id="chcls">Сменить</button></div>`;
  drawDoll();
  SLOTS.forEach(s => { $b('slot-' + s.id)!.onclick = () => { const e = S.eq[s.id]; if (e) { sel = e.id; renderGear(); } }; });
  inv.forEach(i => { $b('it-' + i.id)!.onclick = () => { sel = sel === i.id ? null : i.id; renderGear(); }; });
  if (it) {
    const eb = $b('equip'); if (eb) eb.onclick = () => { equip(it); sel = null; renderPanel(); drawAva(); };
    const ub = $b('unequip'); if (ub) ub.onclick = () => {
      if (it.slot === 'weapon') return toast('Без оружия в путь не выйти', '#9ea6c0');
      S.inv.push(it); delete S.eq[it.slot]; sel = null; save(); renderPanel(); drawAva();
    };
    const sb = $b('sell'); if (sb) sb.onclick = () => { S.gold += sellVal(it); S.inv = S.inv.filter(x => x.id !== it.id); sel = null; save(); renderPanel(); };
  }
  $b('best')!.onclick = () => {
    SLOTS.forEach(s => { const c = S.inv.filter(i => i.slot === s.id).sort((a, b) => score(b) - score(a))[0]; if (c && isUpgrade(c)) equip(c); });
    sel = null; renderPanel(); drawAva();
  };
  $b('sellworse')!.onclick = () => {
    let g = 0; S.inv = S.inv.filter(i => { if (S.eq[i.slot] && !isUpgrade(i)) { g += sellVal(i); return false; } return true; });
    S.gold += g; if (g) toast('Продано +' + fmt(g) + ' 金', '#e3b456'); sel = null; save(); renderPanel();
  };
  $b('chg')!.onclick = () => openPicker('gender', true); $b('chcls')!.onclick = () => openPicker('class', true);
}
function drawDoll() {
  const d = document.getElementById('doll') as HTMLCanvasElement | null; if (!d || !S.g) return;
  const r = d.getBoundingClientRect(), k = window.devicePixelRatio || 1;
  d.width = Math.round((r.width || 200) * k); d.height = Math.round((r.width || 200) * 1.2 * k);
  const c = d.getContext('2d')!, w = d.width, h = d.height; portraitBg(c, w, h, S.g);
  const s = w / 100; drawHero(c, w / 2 - 4 * s, h * 0.94, s, S.eq, { g: S.g, t: 0, run: false, anim: 0, wt: cls().w, procedural: true });
}

function renderSkillTab() {
  $('ptools').innerHTML = '<span class="mono" style="font-size:.8rem;color:#b9a8ff">' + S.soul + ' 魂</span>';
  $('pbody').innerHTML = '<span class="lbl">' + cls().name + ' · души дают боссы и задания</span>' + cls().skills.map((sk, i) => {
    const l = S.skL[i] || 0, c = skCost(l), lock = S.lvl < sk.lvl;
    return `<div class="row"><span class="ic">${sk.kj}</span><div class="txt">${sk.name} <span class="mono" style="color:var(--gold-hi)">${lock ? '' : 'ур. ' + l}</span><small>${sk.desc} · ${sk.cd} с</small><small class="val">${lock ? 'Откроется на ' + sk.lvl + ' уровне' : 'Сила ×' + skF(i).toFixed(2)}</small></div>
    <button class="gbtn buy" id="skup-${i}" ${lock || S.gold < c.gold || S.soul < c.soul ? 'disabled' : ''}>${lock ? sk.lvl + ' ур.' : fmt(c.gold) + ' 金<small>' + c.soul + ' 魂</small>'}</button></div>`;
  }).join('') + '<p class="empty-note">Каждый уровень навыка добавляет 25% силы и полсекунды к длительности баффов.</p>';
  cls().skills.forEach((_sk, i) => {
    $b('skup-' + i)!.onclick = () => {
      const c = skCost(S.skL[i] || 0); if (S.gold < c.gold || S.soul < c.soul) return;
      S.gold -= c.gold; S.soul -= c.soul; S.skL[i] = (S.skL[i] || 0) + 1; save(); renderSkills(); renderPanel();
    };
  });
}

function renderScroll() {
  $('pbody').innerHTML = `<div class="scroll"><span class="lbl">Свиток · концепт</span><h3>Клинок Ёми</h3>
    <p>Эпоха Сэнгоку, которой не было. В ночь кровавой луны врата Ёми, страны мёртвых, приоткрылись, и по дорогам пошли ёкаи. Рэн, ронин в чёрном кимоно, или Юки, мечница с драконом на плече, находит в сломанном клинке духа меча Цукуёми. Каждая убитая тварь отдаёт ему душу и делает хозяина сильнее. Путь лежит на север, к горе Осорэ, чтобы закрыть врата.</p></div>
  <div class="scroll"><span class="lbl">Правила игры</span><ul>
    <li><b>Без доната.</b> Сила берётся только из игры: бег, лут, тренировка, навыки.</li>
    <li><b>Косметика</b>, если появится, только меняет вид и не даёт статов.</li>
    <li><b>Лут решает.</b> 6 слотов, 5 градов, каждая вещь видна на герое.</li>
    <li><b>Класс = оружие.</b> Самурай, Сохэй, Лучник, Синоби. Падает только оружие своего класса.</li>
    <li><b>Две валюты.</b> Золото на тренировку, души 魂 на навыки.</li></ul>
    <div class="grades">${RN.map((n, i) => `<span class="grade" style="color:${RC[i]}">${n} ×${RM[i]}</span>`).join('')}</div></div>
  <div class="scroll"><span class="lbl">Акты</span><ul class="acts">${ACTS.map((a, i) => {
    const open = S.best > i * ACT_STAGES, done = S.best > (i + 1) * ACT_STAGES;
    return open ? `<li><b>${a.roman}. ${a.name}</b>${done ? ' ✓' : ''}<br><small>${a.zones.map(z => z.name).join(' → ')} · босс ${a.boss.name}</small> <button class="mini" data-act="${i}">История</button></li>`
      : `<li class="locked"><b>${a.roman}. ???</b><br><small>Откроется после акта ${ACTS[i - 1].roman}</small></li>`;
  }).join('')}<li class="locked"><b>VI. Гора Осорэ</b><br><small>Скоро</small></li></ul></div>
  <div class="scroll"><span class="lbl">Прогресс</span><button id="wipe">Стереть прогресс</button></div>`;
  document.querySelectorAll<HTMLButtonElement>('[data-act]').forEach(b => { b.onclick = () => showIntro(+b.dataset.act!); });
  const wb = $b('wipe')!;
  wb.onclick = () => {
    if (!wb.dataset.c) { wb.dataset.c = '1'; wb.textContent = 'Точно стереть? Нажми ещё раз'; return; }
    resetSave(); resetBattle(); setTab('grow'); renderSkills(); renderTop(); openPicker('gender');
  };
}

/** story card shown once when the hero enters a new act */
function maybeIntro() {
  const n = Math.floor((S.stage - 1) / ACT_STAGES);
  if (!S.g || !S.cls || n <= S.seenAct || !$('picker').hidden) return;
  S.seenAct = n; save(); showIntro(n % ACTS.length);
}
function showIntro(i: number) {
  const a = ACTS[i], z = a.zones[0];
  $('picker').hidden = false;
  $('pinner').innerHTML = `<div class="intro" style="--sky0:${z.sky[0]};--sky1:${z.sky[1]};--moon:${z.moon}">
    <span class="lbl">Акт ${a.roman}</span><h2>${a.name}</h2>${a.story.map(p => `<p>${p}</p>`).join('')}
    <ul>${a.zones.map((zz, k) => `<li><b>${k + 1}.</b> ${zz.name}${zz.mini ? ' · страж ' + zz.mini.name : ''}</li>`).join('')}<li><b>Босс:</b> ${a.boss.name}</li></ul>
    <button class="cta" id="go">В путь</button></div>`;
  $b('go')!.onclick = () => { $('picker').hidden = true; };
}

export function openPicker(step: 'gender' | 'class', single = false) {
  const inner = $('pinner'); $('picker').hidden = false;
  if (step === 'gender') {
    inner.innerHTML = '<span class="lbl">Клинок Ёми</span><h2>Выбери героя</h2><p>Облик меняется от надетой экипировки, но характер героя остаётся.</p><div class="genders">'
      + (['m', 'f'] as Gender[]).map(g => `<button class="gcard" id="g-${g}" aria-pressed="${S.g === g}"><canvas id="gc-${g}" aria-hidden="true"></canvas><span><b>${HERO[g].name}</b><small>${g === 'm' ? 'Мужской' : 'Женский'} · ${HERO[g].desc}</small></span></button>`).join('') + '</div>';
    (['m', 'f'] as Gender[]).forEach(g => {
      const cvs = $('gc-' + g) as HTMLCanvasElement, r = cvs.getBoundingClientRect(), k = window.devicePixelRatio || 1;
      cvs.width = Math.round((r.width || 180) * k); cvs.height = Math.round((r.width || 180) * 4 / 3 * k);
      const c = cvs.getContext('2d')!, w = cvs.width, h = cvs.height;
      const paint = () => { portraitBg(c, w, h, g); drawHero(c, w * 0.48, h * 0.93, w / 112, {}, { g, t: 0, run: false, anim: 0, wt: 'katana' }); };
      paint(); artReady.then(paint);
      $b('g-' + g)!.onclick = () => { S.g = g; save(); if (single || S.cls) { $('picker').hidden = true; renderTop(); renderPanel(); maybeIntro(); } else openPicker('class'); };
    });
    return;
  }
  inner.innerHTML = '<span class="lbl">' + (S.g ? HERO[S.g].name : '') + '</span><h2>Выбери путь</h2><p>Класс определяет оружие, которое будет выпадать, и навыки.</p><div id="clslist" style="display:grid;gap:10px"></div>';
  CLASSES.forEach(c => {
    const b = document.createElement('button'); b.className = 'cls'; b.id = 'cls-' + c.id;
    b.innerHTML = '<span class="kj">' + c.kj + '</span><span><b>' + c.name + '</b><small>' + c.desc + '</small><i>' + c.skills.map(s => s.name).join(' · ') + '</i></span>';
    b.onclick = () => {
      const first = !S.cls; S.cls = c.id;
      if (first || !S.eq.weapon || S.eq.weapon.wt !== c.w) {
        if (S.eq.weapon && S.eq.weapon.wt !== c.w) S.inv.push(S.eq.weapon);
        const own = S.inv.filter(i => i.slot === 'weapon' && i.wt === c.w).sort((a, b) => score(b) - score(a))[0];
        if (own) equip(own);
        else { const w = genItem('weapon', Math.max(1, S.stage - 1), 0, 1); w.r = 0; w.atk = Math.round((4 + S.stage * 3) * 0.9); w.pow = w.atk; S.eq.weapon = w; }
      }
      skillCd.fill(0); save(); $('picker').hidden = true; renderSkills(); renderTop(); renderPanel(); maybeIntro();
    };
    $('clslist').appendChild(b);
  });
}

export function initUI() {
  (Object.keys(TABS) as Tab[]).forEach(x => { $('tab-' + x).onclick = () => setTab(x); });
  ($('quest') as HTMLButtonElement).onclick = claimQuest;
  on('toast', toast);
  on('top', renderTop);
  on('skills', renderSkills);
  on('loot', () => { if (tab === 'gear') renderPanel(); else updateDots(); });
  on('progress', () => { if (tab === 'grow') renderPanel(); });
  on('act', maybeIntro);
  window.addEventListener('resize', () => { if (tab === 'gear') drawDoll(); });
  if (document.fonts) document.fonts.ready.then(() => { drawAva(); if (tab === 'gear') drawDoll(); });
  artReady.then(() => { drawAva(); if (tab === 'gear') drawDoll(); });

  let t0: string = 'grow';
  try { t0 = localStorage.getItem('yomi-tab') || 'grow'; } catch { /* storage blocked */ }
  renderSkills(); setTab((t0 in TABS ? t0 : 'grow') as Tab); renderTop();
  if (!S.g) openPicker('gender'); else if (!S.cls) openPicker('class'); else maybeIntro();
  setInterval(hud, 250);
}
