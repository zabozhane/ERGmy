// Static game data: classes, weapons, slots, quests. Acts and enemies live in acts.ts.

export const W = 540, H = 380, GROUND = 322, PX = 118;

export type Rarity = 0 | 1 | 2 | 3 | 4;
export const RC = ['#8f96ad', '#5b93d3', '#a678dc', '#e0aa45', '#e2566c'];
export const RN = ['Обычное', 'Редкое', 'Эпическое', 'Легендарное', 'Мифическое'];
export const OWNER = ['Ронина', 'Самурая', 'Хатамото', 'Даймё', 'Ками'];
export const RM = [1, 1.8, 3.2, 6, 12];

export type Gender = 'm' | 'f';
export const HERO: Record<Gender, { name: string; desc: string }> = {
  m: { name: 'Рэн', desc: 'Пучок, тёмные очки, длинное чёрное кимоно, две катаны' },
  f: { name: 'Юки', desc: 'Серебряные волосы, тату дракона, катана за спиной' },
};

export type SlotId = 'helm' | 'armor' | 'arms' | 'weapon' | 'legs' | 'charm';
export const SLOTS: { id: SlotId; name: string; noun: string; kj: string }[] = [
  { id: 'helm', name: 'Шлем', noun: 'Кабуто', kj: '兜' },
  { id: 'armor', name: 'Доспех', noun: 'До', kj: '鎧' },
  { id: 'arms', name: 'Наручи', noun: 'Котэ', kj: '籠' },
  { id: 'weapon', name: 'Оружие', noun: '', kj: '刀' },
  { id: 'legs', name: 'Поножи', noun: 'Сунэатэ', kj: '脛' },
  { id: 'charm', name: 'Амулет', noun: 'Омамори', kj: '守' },
];

export type WeaponType = 'katana' | 'nagi' | 'yumi' | 'shur';
export type AttackKind = 'melee' | 'sweep' | 'arrow' | 'star';
export const WT: Record<WeaponType, { noun: string; kj: string; range: number; cd: number; mult: number; crit: number; kind: AttackKind }> = {
  katana: { noun: 'Катана', kj: '刀', range: 72, cd: 0.55, mult: 1, crit: 0.12, kind: 'melee' },
  nagi: { noun: 'Нагината', kj: '薙', range: 118, cd: 1.0, mult: 0.95, crit: 0.04, kind: 'sweep' },
  yumi: { noun: 'Юми', kj: '弓', range: 330, cd: 0.9, mult: 1.15, crit: 0.08, kind: 'arrow' },
  shur: { noun: 'Сюрикены', kj: '星', range: 260, cd: 0.34, mult: 0.36, crit: 0.06, kind: 'star' },
};

export interface Skill { id: string; kj: string; name: string; cd: number; lvl: number; desc: string }
export interface ClassDef { id: string; name: string; kj: string; w: WeaponType; desc: string; skills: Skill[] }
export const CLASSES: ClassDef[] = [
  { id: 'samurai', name: 'Самурай', kj: '侍', w: 'katana', desc: 'Катана. Быстрые удары по одной цели, высокий крит.',
    skills: [
      { id: 'iai', kj: '居', name: 'Иайдзюцу', cd: 7, lvl: 1, desc: 'Удар из ножен ×6 по ближайшему врагу' },
      { id: 'petal', kj: '桜', name: 'Танец лепестков', cd: 10, lvl: 5, desc: 'Три удара ×2 по всем рядом' },
      { id: 'kiai', kj: '気', name: 'Киай', cd: 18, lvl: 10, desc: 'Атака ×1.6 на 6 с' }] },
  { id: 'sohei', name: 'Сохэй', kj: '僧', w: 'nagi', desc: 'Нагината. Монах-воин: широкий размах по всем рядом.',
    skills: [
      { id: 'whirl', kj: '旋', name: 'Вихрь', cd: 8, lvl: 1, desc: 'Круговой удар ×3 по всем в радиусе' },
      { id: 'quake', kj: '震', name: 'Удар о землю', cd: 12, lvl: 5, desc: '×2 по всем на экране и оглушение 2 с' },
      { id: 'will', kj: '心', name: 'Железное сердце', cd: 20, lvl: 10, desc: 'Восстанавливает 40% здоровья' }] },
  { id: 'kyudo', name: 'Лучник', kj: '弓', w: 'yumi', desc: 'Юми. Атакует издалека, стрелы пробивают ряд.',
    skills: [
      { id: 'pierce', kj: '貫', name: 'Пробивная стрела', cd: 7, lvl: 1, desc: 'Стрела ×6, пробивает всех' },
      { id: 'rain', kj: '雨', name: 'Дождь стрел', cd: 12, lvl: 5, desc: '×2.5 по всем врагам на экране' },
      { id: 'hawk', kj: '鷹', name: 'Глаз ястреба', cd: 18, lvl: 10, desc: '+40% шанс крита на 6 с' }] },
  { id: 'shinobi', name: 'Синоби', kj: '忍', w: 'shur', desc: 'Сюрикены. Шквал быстрых бросков веером.',
    skills: [
      { id: 'fan', kj: '扇', name: 'Веер клинков', cd: 6, lvl: 1, desc: 'Девять сюрикенов веером' },
      { id: 'smoke', kj: '煙', name: 'Дымовая бомба', cd: 14, lvl: 5, desc: 'Неуязвимость 3 с и ×2 по всем рядом' },
      { id: 'clone', kj: '影', name: 'Теневой клон', cd: 20, lvl: 10, desc: 'Двойные броски на 7 с' }] },
];

export type QuestKind = 'kill' | 'atk' | 'hp' | 'equip' | 'boss' | 'skill' | 'stage';
export interface Quest { k: QuestKind; n: number; txt: string }
export const QUESTS: Quest[] = [
  { k: 'kill', n: 10, txt: 'Победи 10 ёкаев' },
  { k: 'atk', n: 5, txt: 'Тренируй атаку до 5 ур.' },
  { k: 'equip', n: 1, txt: 'Надень вещь из сумки' },
  { k: 'boss', n: 1, txt: 'Победи босса' },
  { k: 'skill', n: 5, txt: 'Используй навыки 5 раз' },
  { k: 'hp', n: 10, txt: 'Тренируй здоровье до 10 ур.' },
  { k: 'stage', n: 12, txt: 'Дойди до этапа I · 2-2' },
];
