import Phaser from 'phaser';
import { H, W } from '../data';
import { S } from '../state';
import { draw, update } from './battle';

/** Renders the battle into a CanvasTexture at 2x for sharp lines on phones. */
export const RES = 2;
export class BattleScene extends Phaser.Scene {
  private tex!: Phaser.Textures.CanvasTexture;
  constructor() { super('battle'); }
  create() {
    this.tex = this.textures.createCanvas('frame', W * RES, H * RES)!;
    this.add.image(0, 0, 'frame').setOrigin(0);
  }
  update(_time: number, deltaMs: number) {
    const dt = Math.min(0.05, deltaMs / 1000);
    if (S.cls && S.g) update(dt);
    const ctx = this.tex.getContext();
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    draw(ctx);
    this.tex.refresh();
  }
}
