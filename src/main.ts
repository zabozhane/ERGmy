import Phaser from 'phaser';
import './style.css';
import { H, W } from './data';
import { S, fmt, goldMul, maxHp, save } from './state';
import { BattleScene, RES } from './game/BattleScene';
import { initUI, toast, updateSkillUI } from './ui/ui';

// reward for the time the game was closed, capped at 8 hours
if (S.cls && S.g && S.last) {
  const min = Math.min(480, (Date.now() - S.last) / 60000);
  if (min >= 1) {
    const g = Math.floor(min * 6 * Math.pow(1.19, S.stage - 1) * goldMul());
    S.gold += g;
    setTimeout(() => toast('Пока тебя не было ' + Math.floor(min) + ' мин: +' + fmt(g) + ' 金', '#e3b456'), 600);
  }
}
S.hp = Math.min(S.hp || maxHp(), maxHp());
save();

initUI();

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: W * RES,
  height: H * RES,
  backgroundColor: '#181e33',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BattleScene],
  banner: false,
});

const tick = () => { updateSkillUI(); requestAnimationFrame(tick); };
requestAnimationFrame(tick);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
setInterval(save, 10000);
