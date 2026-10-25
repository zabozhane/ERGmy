// Acts: each act is one location of 3 zones × 10 stages, with zone mini-bosses
// and a phased act boss. Design notes and references: docs/ACTS.md.

export type FoeKind = 'kappa' | 'tanuki' | 'oni' | 'tengu' | 'yurei' | 'skull' | 'onibi' | 'ashigaru' | 'monk' | 'crow' | 'wheel' | 'hand';
export type BossKind = 'necro' | 'faceless' | 'kaisen' | 'shura' | 'reaper';

export const FOE: Record<FoeKind, { col: string; r: number; fly?: boolean }> = {
  kappa: { col: '#6f9f6a', r: 19 }, tanuki: { col: '#9b744d', r: 21 }, oni: { col: '#c4544e', r: 24 },
  tengu: { col: '#c94a45', r: 21 }, yurei: { col: '#d8dbe6', r: 20 }, skull: { col: '#e9e4d6', r: 15, fly: true },
  onibi: { col: '#5fd3e0', r: 13, fly: true }, ashigaru: { col: '#d9d2bd', r: 19 }, monk: { col: '#e8dccb', r: 21 },
  crow: { col: '#1c1c24', r: 14, fly: true }, wheel: { col: '#ff8a3c', r: 20 }, hand: { col: '#e6d6d0', r: 16 },
};

export type Particles = 'leaf' | 'petal' | 'redpetal' | 'onibi' | 'fog' | 'snow' | 'ember' | 'ash' | 'steam';
export type Prop = 'bamboo' | 'village' | 'jizo' | 'terraces' | 'river' | 'dojo' | 'stairs' | 'burned' | 'hall'
  | 'camp' | 'fogfield' | 'banners' | 'sulfur' | 'ruins' | 'jigoku';

export interface Zone {
  name: string; sky: [string, string]; far: string; near: string; ground: string; moon: string; moonR: number;
  part: Particles; prop: Prop; foes: FoeKind[]; mini?: { name: string; kind: FoeKind };
}

/** Building blocks a boss phase is assembled from. */
export type BossAction =
  | { a: 'summon'; kind: FoeKind; n: number; every: number }
  | { a: 'shield'; perAdd: number }            // damage taken cut per living add
  | { a: 'heal'; pct: number }                 // share of max HP per second while adds live
  | { a: 'parry'; every: number }              // every Nth hero hit is parried and countered
  | { a: 'dash'; every: number; warn: number; mult: number }
  | { a: 'pillar'; every: number; warn: number; pct: number }
  | { a: 'enrage' }                            // faster and harder as HP drops
  | { a: 'bleed'; pct: number; time: number }
  | { a: 'sentence'; every: number; window: number; need: number; pct: number }
  | { a: 'fly'; meleeCut: number };

export interface BossDef { name: string; kind: BossKind; col: string; time: number; phases: { at: number; title?: string; actions: BossAction[] }[] }

export interface Act { roman: string; name: string; ink?: boolean; story: string[]; zones: [Zone, Zone, Zone]; boss: BossDef }

export const ZONE_STAGES = 10, ACT_STAGES = 30;

export const ACTS: Act[] = [
  { roman: 'I', name: 'Поле Адасино',
    story: ['Кровавая луна над Киото. Жрецы клана Курояма сломали печать, и врата Ёми приоткрылись.',
      'Дорога на север лежит через бамбуковую рощу Сага к полю Адасино, где веками хоронили мёртвых.',
      'Там, среди тысяч каменных дзидзо, ждёт тот, кто всё начал.'],
    zones: [
      { name: 'Бамбуковая роща Сага', sky: ['#13221f', '#3d5a48'], far: '#22382f', near: '#1a2b24', ground: '#2a2d26', moon: '#f2e6d6', moonR: 30, part: 'leaf', prop: 'bamboo', foes: ['kappa', 'tanuki'], mini: { name: 'Тануки Бумбуку', kind: 'tanuki' } },
      { name: 'Заброшенная деревня', sky: ['#121a2a', '#2f4a62'], far: '#1e2a3d', near: '#172030', ground: '#24262c', moon: '#d8e6ee', moonR: 34, part: 'onibi', prop: 'village', foes: ['onibi', 'ashigaru'], mini: { name: 'Фонарь-обакэ', kind: 'yurei' } },
      { name: 'Поле Адасино', sky: ['#0d1626', '#1f4e5c'], far: '#173444', near: '#102633', ground: '#1d2a30', moon: '#bfeef0', moonR: 44, part: 'onibi', prop: 'jizo', foes: ['skull', 'ashigaru', 'onibi'] },
    ],
    boss: { name: 'Курояма Сэйгэн', kind: 'necro', col: '#2f5f8a', time: 60, phases: [
      { at: 1, actions: [{ a: 'summon', kind: 'skull', n: 3, every: 12 }, { a: 'shield', perAdd: 0.17 }] },
      { at: 0.5, title: 'Бирюзовый дым', actions: [{ a: 'summon', kind: 'skull', n: 3, every: 10 }, { a: 'shield', perAdd: 0.17 }, { a: 'heal', pct: 0.012 }] }] } },

  { roman: 'II', name: 'Долина хиганбаны',
    story: ['Осень на дороге Кисо. Рисовые террасы и берега реки покрыты красными лилиями мёртвых.',
      'Говорят, в разрушенном додзё на закате всё ещё тренируется мастер, у которого Ёми забрала лицо.'],
    zones: [
      { name: 'Рисовые террасы', sky: ['#3a2a22', '#d9b98c'], far: '#8a6a4a', near: '#5a4532', ground: '#4a3a2a', moon: '#f4d9b0', moonR: 50, part: 'redpetal', prop: 'terraces', foes: ['tengu', 'crow'], mini: { name: 'Ворон-тэнгу', kind: 'tengu' } },
      { name: 'Берег хиганбаны', sky: ['#4a2a22', '#e3b98a'], far: '#9a5a44', near: '#5a3328', ground: '#3a2620', moon: '#f7c9a0', moonR: 60, part: 'redpetal', prop: 'river', foes: ['kappa', 'yurei', 'crow'], mini: { name: 'Речной дух', kind: 'kappa' } },
      { name: 'Разрушенное додзё', sky: ['#2a1414', '#e0b48a'], far: '#7a3a2a', near: '#3a1a16', ground: '#2a1a16', moon: '#e5463f', moonR: 82, part: 'redpetal', prop: 'dojo', foes: ['ashigaru', 'yurei'] },
    ],
    boss: { name: 'Безликий мастер меча', kind: 'faceless', col: '#1a1a1e', time: 60, phases: [
      { at: 1, actions: [{ a: 'parry', every: 5 }] },
      { at: 0.5, title: 'Иайдзюцу', actions: [{ a: 'parry', every: 5 }, { a: 'dash', every: 9, warn: 1.5, mult: 3 }] }] } },

  { roman: 'III', name: 'Сожжённый храм на горе Хиэй',
    story: ['Монастырь воинов-монахов сгорел за одну ночь. Пепел не остыл до сих пор.',
      'Наверху тысячи ступеней настоятель Кайсэн молился статуе тысячерукой Каннон, пока не стал её частью.'],
    zones: [
      { name: 'Тысяча ступеней', sky: ['#1a1024', '#4a2a4e'], far: '#2a1a34', near: '#1a1022', ground: '#2a2230', moon: '#e2566c', moonR: 40, part: 'ash', prop: 'stairs', foes: ['monk', 'oni'], mini: { name: 'Страж ворот Нио', kind: 'oni' } },
      { name: 'Сожжённые залы', sky: ['#1c0e1e', '#5a1e3a'], far: '#2e1426', near: '#1a0c18', ground: '#24161e', moon: '#e2566c', moonR: 46, part: 'ember', prop: 'burned', foes: ['monk', 'wheel'], mini: { name: 'Колокол-цукумогами', kind: 'yurei' } },
      { name: 'Главный зал', sky: ['#120a1c', '#3a1440'], far: '#24122e', near: '#160a1e', ground: '#1e1222', moon: '#ff3d6e', moonR: 70, part: 'ember', prop: 'hall', foes: ['monk', 'hand'] },
    ],
    boss: { name: 'Тысячерукий Кайсэн', kind: 'kaisen', col: '#e8dccb', time: 60, phases: [
      { at: 1, actions: [{ a: 'summon', kind: 'hand', n: 4, every: 14 }, { a: 'shield', perAdd: 0.15 }] },
      { at: 0.5, title: 'Столб пламени', actions: [{ a: 'summon', kind: 'hand', n: 3, every: 14 }, { a: 'shield', perAdd: 0.15 }, { a: 'pillar', every: 11, warn: 2, pct: 0.6 }] }] } },

  { roman: 'IV', name: 'Поле Сэкигахары', ink: true,
    story: ['Над полем великой битвы туман не рассеивается уже сто лет.',
      'Здесь всё серое, как тушь на бумаге. Красными остались только кровь и знамёна.',
      'На холме ждёт ронин, вернувшийся из мира асуров.'],
    zones: [
      { name: 'Брошенный лагерь', sky: ['#cfc8b8', '#e9e3d4'], far: '#9a9488', near: '#5a564e', ground: '#d8d1c0', moon: '#b3242c', moonR: 38, part: 'ash', prop: 'camp', foes: ['ashigaru', 'crow'], mini: { name: 'Знаменосец', kind: 'ashigaru' } },
      { name: 'Поле в тумане', sky: ['#c4bdae', '#e4ddcc'], far: '#8a8478', near: '#4a4640', ground: '#cfc8b6', moon: '#b3242c', moonR: 44, part: 'fog', prop: 'fogfield', foes: ['ashigaru', 'yurei', 'crow'], mini: { name: 'Генерал без головы', kind: 'yurei' } },
      { name: 'Холм знамён', sky: ['#b8b0a0', '#e0d8c6'], far: '#7a7468', near: '#3a3632', ground: '#c4bca8', moon: '#b3242c', moonR: 64, part: 'ash', prop: 'banners', foes: ['oni', 'ashigaru'] },
    ],
    boss: { name: 'Сюра, демон-ронин', kind: 'shura', col: '#e8e2d4', time: 60, phases: [
      { at: 1, actions: [{ a: 'enrage' }] },
      { at: 0.3, title: 'Маска они', actions: [{ a: 'enrage' }, { a: 'bleed', pct: 0.04, time: 3 }] }] } },

  { roman: 'V', name: 'Адские источники Ундзэн',
    story: ['Кюсю. Серный пар над вулканом Ундзэн местные зовут адами.',
      'Здесь служит палач судьи мёртвых Эммы. В его красном свитке записаны имена тех, кому пора.'],
    zones: [
      { name: 'Серные поля', sky: ['#2a1c10', '#b08a5a'], far: '#6a4a2a', near: '#3a2816', ground: '#5a4430', moon: '#f0c27a', moonR: 40, part: 'steam', prop: 'sulfur', foes: ['wheel', 'oni'], mini: { name: 'Сютэн-додзи', kind: 'oni' } },
      { name: 'Руины Симабары', sky: ['#24160e', '#9a7048'], far: '#5a3e24', near: '#2e1e12', ground: '#4a3626', moon: '#e0a060', moonR: 46, part: 'ash', prop: 'ruins', foes: ['ashigaru', 'crow', 'yurei'], mini: { name: 'Комендант крепости', kind: 'ashigaru' } },
      { name: 'Дзигоку', sky: ['#1e0c08', '#8a3a1e'], far: '#4a1c10', near: '#2a0e08', ground: '#3a1a10', moon: '#ff4a2a', moonR: 60, part: 'steam', prop: 'jigoku', foes: ['oni', 'wheel'] },
    ],
    boss: { name: 'Жнец Ундзэна', kind: 'reaper', col: '#1a1416', time: 75, phases: [
      { at: 1, actions: [{ a: 'sentence', every: 15, window: 5, need: 0.08, pct: 0.7 }] },
      { at: 0.5, title: 'Чёрные крылья', actions: [{ a: 'sentence', every: 13, window: 5, need: 0.08, pct: 0.7 }, { a: 'fly', meleeCut: 0.5 }] }] } },
];

/** Where a global stage number lands: act, zone, stage inside zone, and the loop count. */
export function locate(stage: number) {
  const i = stage - 1, actAbs = Math.floor(i / ACT_STAGES);
  const act = ACTS[actAbs % ACTS.length], cycle = Math.floor(actAbs / ACTS.length);
  const zi = Math.floor((i % ACT_STAGES) / ZONE_STAGES), sub = i % ZONE_STAGES + 1;
  return { act, actIdx: actAbs % ACTS.length, cycle, zone: act.zones[zi], zi, sub };
}
export function stageLabel(stage: number) {
  const l = locate(stage);
  return (l.cycle ? 'Круг ' + (l.cycle + 1) + ' · ' : '') + l.act.roman + ' · ' + (l.zi + 1) + '-' + l.sub;
}
/** Kind of boss that closes the stage: a stronger regular foe, a zone mini-boss, or the act boss. */
export function stageBoss(stage: number): 'stage' | 'mini' | 'act' {
  const l = locate(stage);
  if (l.sub < ZONE_STAGES) return 'stage';
  return l.zi === 2 ? 'act' : 'mini';
}

/** Act IV is drawn as an ink scroll: every foe is mapped to grey. */
export function inkColor(hex: string) {
  const n = parseInt(hex.slice(1), 16), v = Math.round(((n >> 16) * 0.3 + (n >> 8 & 255) * 0.59 + (n & 255) * 0.11) * 0.85);
  const h = v.toString(16).padStart(2, '0'); return '#' + h + h + h;
}
