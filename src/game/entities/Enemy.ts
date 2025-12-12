/**
 * Enemy.ts - Enemy character with procedural rendering
 *
 * Features:
 * - Different enemy types (skeleton, orc, demon)
 * - Combat animations
 * - Visual feedback on hit
 */

import Phaser from 'phaser';
import type { BattleScene } from '../scenes/BattleScene';
import { EnemyType } from '../systems/CombatSystem';
import { CombatAnimState } from './Hero';

// Enemy type configurations
const ENEMY_CONFIG: Record<EnemyType, {
  colors: { primary: number; secondary: number; accent: number; skin: number };
  maxHP: number;
  size: number;
}> = {
  skeleton: {
    colors: { primary: 0xe8e8e8, secondary: 0xc0c0c0, accent: 0x404040, skin: 0xf5f5dc },
    maxHP: 80,
    size: 0.9,
  },
  orc: {
    colors: { primary: 0x4a5a2a, secondary: 0x3a4a1a, accent: 0x8b0000, skin: 0x5a7a3a },
    maxHP: 120,
    size: 1.15,
  },
  demon: {
    colors: { primary: 0x8b0000, secondary: 0x4a0000, accent: 0xff4500, skin: 0x800000 },
    maxHP: 100,
    size: 1.1,
  },
};

export class Enemy extends Phaser.GameObjects.Container {
  public scene: BattleScene;

  // Stats
  public maxHP = 100;
  public currentHP = 100;

  // State
  private enemyType: EnemyType = 'skeleton';
  public animState: CombatAnimState = CombatAnimState.IDLE;

  // Graphics
  private bodyGraphics!: Phaser.GameObjects.Graphics;
  private weaponGraphics!: Phaser.GameObjects.Graphics;
  private effectsGraphics!: Phaser.GameObjects.Graphics;

  // Animation
  private animTimer = 0;
  private bobOffset = 0;
  private armAngle = 0;

  // Position tracking
  private baseX: number;
  private baseY: number;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;

    // Create graphics
    this.effectsGraphics = scene.add.graphics();
    this.bodyGraphics = scene.add.graphics();
    this.weaponGraphics = scene.add.graphics();

    this.add([this.effectsGraphics, this.bodyGraphics, this.weaponGraphics]);

    scene.add.existing(this);
    this.setDepth(10);

    // Apply initial config
    this.applyTypeConfig();
    this.drawCharacter();
  }

  update(time: number, delta: number): void {
    this.animTimer += delta;

    if (this.animState === CombatAnimState.IDLE) {
      this.bobOffset = Math.sin(this.animTimer * 0.0025) * 3;
      this.armAngle = Math.sin(this.animTimer * 0.002) * 0.08;
    }

    this.drawCharacter();
  }

  private applyTypeConfig(): void {
    const config = ENEMY_CONFIG[this.enemyType];
    this.maxHP = config.maxHP;
    this.currentHP = config.maxHP;
  }

  private drawCharacter(): void {
    const g = this.bodyGraphics;
    const w = this.weaponGraphics;
    const e = this.effectsGraphics;

    g.clear();
    w.clear();
    e.clear();

    const config = ENEMY_CONFIG[this.enemyType];
    const colors = config.colors;
    const scale = config.size;

    // Draw based on enemy type
    switch (this.enemyType) {
      case 'skeleton':
        this.drawSkeleton(g, w, e, colors, scale);
        break;
      case 'orc':
        this.drawOrc(g, w, e, colors, scale);
        break;
      case 'demon':
        this.drawDemon(g, w, e, colors, scale);
        break;
    }

    // Hit flash
    if (this.animState === CombatAnimState.HIT) {
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(-50, -160 * scale, 100, 170 * scale);
    }
  }

  private drawSkeleton(g: Phaser.GameObjects.Graphics, w: Phaser.GameObjects.Graphics, e: Phaser.GameObjects.Graphics, colors: { primary: number; secondary: number; accent: number; skin: number }, scale: number): void {
    const yOffset = -140 * scale + this.bobOffset;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 5, 40 * scale, 12);

    // Legs (bones)
    g.fillStyle(colors.primary, 1);
    g.fillRect(-15 * scale, yOffset + 90, 6 * scale, 50 * scale);
    g.fillRect(9 * scale, yOffset + 90, 6 * scale, 50 * scale);

    // Pelvis
    g.fillEllipse(0, yOffset + 90, 25 * scale, 10 * scale);

    // Spine
    for (let i = 0; i < 5; i++) {
      g.fillCircle(0, yOffset + 85 - i * 12 * scale, 5 * scale);
    }

    // Ribcage
    g.fillStyle(colors.secondary, 1);
    for (let i = 0; i < 4; i++) {
      const ribY = yOffset + 45 - i * 8 * scale;
      g.beginPath();
      g.arc(-10 * scale, ribY, 15 * scale, 0, Math.PI, true);
      g.strokePath();
      g.beginPath();
      g.arc(10 * scale, ribY, 15 * scale, 0, Math.PI, true);
      g.strokePath();
    }
    g.lineStyle(2, colors.primary, 1);
    for (let i = 0; i < 4; i++) {
      const ribY = yOffset + 45 - i * 8 * scale;
      g.beginPath();
      g.arc(0, ribY, 18 * scale, Math.PI * 0.2, Math.PI * 0.8, false);
      g.strokePath();
    }

    // Arms (facing left - mirrored hero)
    const armAngle = this.getWeaponArmAngle();
    g.fillStyle(colors.primary, 1);

    // Back arm
    this.drawBoneArm(g, 20 * scale, yOffset + 30, 30 * scale, 0.3 - this.armAngle);

    // Front arm with weapon
    this.drawBoneArm(g, -20 * scale, yOffset + 30, 30 * scale, -armAngle);

    // Skull
    const skullY = yOffset + 10;
    g.fillStyle(colors.skin, 1);
    g.fillCircle(0, skullY, 18 * scale);

    // Eye sockets
    g.fillStyle(colors.accent, 1);
    g.fillCircle(-6 * scale, skullY - 2, 5 * scale);
    g.fillCircle(6 * scale, skullY - 2, 5 * scale);

    // Glowing eyes
    e.fillStyle(0xff0000, 0.8);
    e.fillCircle(-6 * scale, skullY - 2, 3 * scale);
    e.fillCircle(6 * scale, skullY - 2, 3 * scale);

    // Nose hole
    g.fillStyle(colors.accent, 1);
    g.fillTriangle(0, skullY + 3, -3 * scale, skullY + 8, 3 * scale, skullY + 8);

    // Teeth
    g.fillStyle(colors.primary, 1);
    g.fillRect(-10 * scale, skullY + 12, 20 * scale, 5 * scale);
    g.lineStyle(1, colors.accent, 1);
    for (let i = 0; i < 5; i++) {
      g.lineBetween(-8 * scale + i * 4 * scale, skullY + 12, -8 * scale + i * 4 * scale, skullY + 17);
    }

    // Weapon - rusty sword
    const handX = -20 * scale + Math.sin(-armAngle) * 30 * scale;
    const handY = yOffset + 30 + Math.cos(-armAngle) * 30 * scale;
    w.save();
    w.translateCanvas(handX, handY);
    w.rotateCanvas(-armAngle + Math.PI / 4);
    w.fillStyle(0x8b4513, 1);
    w.fillRect(-2, -5, 4, 40);
    w.fillStyle(0x6b6b6b, 1);
    w.fillRect(-3, 30, 6, 4);
    w.restore();
  }

  private drawOrc(g: Phaser.GameObjects.Graphics, w: Phaser.GameObjects.Graphics, e: Phaser.GameObjects.Graphics, colors: { primary: number; secondary: number; accent: number; skin: number }, scale: number): void {
    const yOffset = -150 * scale + this.bobOffset;

    // Shadow
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 5, 55 * scale, 15);

    // Legs
    g.fillStyle(colors.primary, 1);
    g.fillRoundedRect(-20 * scale, yOffset + 100, 15 * scale, 55 * scale, 5);
    g.fillRoundedRect(5 * scale, yOffset + 100, 15 * scale, 55 * scale, 5);

    // Boots
    g.fillStyle(colors.secondary, 1);
    g.fillRoundedRect(-22 * scale, yOffset + 145, 19 * scale, 12 * scale, 4);
    g.fillRoundedRect(3 * scale, yOffset + 145, 19 * scale, 12 * scale, 4);

    // Body
    g.fillStyle(colors.skin, 1);
    g.beginPath();
    g.moveTo(-30 * scale, yOffset + 40);
    g.lineTo(30 * scale, yOffset + 40);
    g.lineTo(25 * scale, yOffset + 100);
    g.lineTo(-25 * scale, yOffset + 100);
    g.closePath();
    g.fillPath();

    // Armor vest
    g.fillStyle(colors.primary, 1);
    g.fillRoundedRect(-25 * scale, yOffset + 45, 50 * scale, 45 * scale, 5);

    // Belt with skulls
    g.fillStyle(colors.secondary, 1);
    g.fillRect(-27 * scale, yOffset + 85, 54 * scale, 10 * scale);
    g.fillStyle(0xe8e8e8, 1);
    g.fillCircle(-15 * scale, yOffset + 90, 5 * scale);
    g.fillCircle(0, yOffset + 90, 5 * scale);
    g.fillCircle(15 * scale, yOffset + 90, 5 * scale);

    // Arms
    const armAngle = this.getWeaponArmAngle();

    // Back arm
    g.fillStyle(colors.skin, 1);
    this.drawMuscularArm(g, 25 * scale, yOffset + 45, 40 * scale, 0.4 - this.armAngle);

    // Front arm
    this.drawMuscularArm(g, -25 * scale, yOffset + 45, 40 * scale, -armAngle);

    // Head
    const headY = yOffset + 20;
    g.fillStyle(colors.skin, 1);
    g.fillCircle(0, headY, 22 * scale);

    // Brow ridge
    g.fillStyle(colors.secondary, 0.5);
    g.fillRect(-18 * scale, headY - 8 * scale, 36 * scale, 8 * scale);

    // Eyes
    g.fillStyle(0x8b0000, 1);
    g.fillCircle(-8 * scale, headY - 2, 4 * scale);
    g.fillCircle(8 * scale, headY - 2, 4 * scale);
    g.fillStyle(0x000000, 1);
    g.fillCircle(-8 * scale, headY - 2, 2 * scale);
    g.fillCircle(8 * scale, headY - 2, 2 * scale);

    // Nose
    g.fillStyle(colors.secondary, 1);
    g.fillTriangle(0, headY, -5 * scale, headY + 10, 5 * scale, headY + 10);

    // Tusks
    g.fillStyle(0xf5f5dc, 1);
    g.beginPath();
    g.moveTo(-12 * scale, headY + 15);
    g.lineTo(-8 * scale, headY + 25);
    g.lineTo(-6 * scale, headY + 15);
    g.closePath();
    g.fillPath();
    g.beginPath();
    g.moveTo(12 * scale, headY + 15);
    g.lineTo(8 * scale, headY + 25);
    g.lineTo(6 * scale, headY + 15);
    g.closePath();
    g.fillPath();

    // Ears
    g.fillStyle(colors.skin, 1);
    g.fillTriangle(-22 * scale, headY - 5, -28 * scale, headY - 15, -22 * scale, headY + 5);
    g.fillTriangle(22 * scale, headY - 5, 28 * scale, headY - 15, 22 * scale, headY + 5);

    // Weapon - large axe
    const handX = -25 * scale + Math.sin(-armAngle) * 40 * scale;
    const handY = yOffset + 45 + Math.cos(-armAngle) * 40 * scale;
    w.save();
    w.translateCanvas(handX, handY);
    w.rotateCanvas(-armAngle + Math.PI / 4);
    // Handle
    w.fillStyle(0x654321, 1);
    w.fillRect(-3, -10, 6, 70);
    // Axe head
    w.fillStyle(0x404040, 1);
    w.beginPath();
    w.moveTo(0, 55);
    w.lineTo(-25, 65);
    w.lineTo(-20, 75);
    w.lineTo(0, 70);
    w.closePath();
    w.fillPath();
    // Edge shine
    w.lineStyle(2, 0x808080, 1);
    w.lineBetween(-25, 65, -20, 75);
    w.restore();
  }

  private drawDemon(g: Phaser.GameObjects.Graphics, w: Phaser.GameObjects.Graphics, e: Phaser.GameObjects.Graphics, colors: { primary: number; secondary: number; accent: number; skin: number }, scale: number): void {
    const yOffset = -155 * scale + this.bobOffset;

    // Hellish glow effect
    e.fillStyle(colors.accent, 0.15);
    e.fillCircle(0, yOffset + 80, 60 * scale);

    // Shadow
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 5, 50 * scale, 15);

    // Legs
    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(-18 * scale, yOffset + 105, 12 * scale, 50 * scale, 4);
    g.fillRoundedRect(6 * scale, yOffset + 105, 12 * scale, 50 * scale, 4);

    // Hooves
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(-20 * scale, yOffset + 148, 16 * scale, 10 * scale, 3);
    g.fillRoundedRect(4 * scale, yOffset + 148, 16 * scale, 10 * scale, 3);

    // Tail
    g.fillStyle(colors.skin, 1);
    g.lineStyle(6 * scale, colors.skin, 1);
    g.beginPath();
    g.moveTo(0, yOffset + 105);
    const tailWave = Math.sin(this.animTimer * 0.003) * 10;
    g.bezierCurveTo(
      30 * scale, yOffset + 120 + tailWave,
      40 * scale, yOffset + 140 - tailWave,
      35 * scale, yOffset + 155
    );
    g.strokePath();
    // Tail tip
    g.fillStyle(colors.primary, 1);
    g.fillTriangle(35 * scale, yOffset + 155, 30 * scale, yOffset + 165, 45 * scale, yOffset + 160);

    // Body
    g.fillStyle(colors.skin, 1);
    g.beginPath();
    g.moveTo(-28 * scale, yOffset + 45);
    g.lineTo(28 * scale, yOffset + 45);
    g.lineTo(22 * scale, yOffset + 105);
    g.lineTo(-22 * scale, yOffset + 105);
    g.closePath();
    g.fillPath();

    // Chest markings
    g.lineStyle(2, colors.accent, 0.6);
    g.beginPath();
    g.moveTo(0, yOffset + 50);
    g.lineTo(-10 * scale, yOffset + 70);
    g.lineTo(0, yOffset + 85);
    g.lineTo(10 * scale, yOffset + 70);
    g.lineTo(0, yOffset + 50);
    g.strokePath();

    // Arms
    const armAngle = this.getWeaponArmAngle();

    // Back arm
    g.fillStyle(colors.skin, 1);
    this.drawDemonArm(g, 25 * scale, yOffset + 50, 38 * scale, 0.3 - this.armAngle, scale);

    // Front arm
    this.drawDemonArm(g, -25 * scale, yOffset + 50, 38 * scale, -armAngle, scale);

    // Wings (simplified)
    g.fillStyle(colors.primary, 0.8);
    // Left wing
    g.beginPath();
    g.moveTo(-20 * scale, yOffset + 50);
    g.lineTo(-50 * scale, yOffset + 20);
    g.lineTo(-60 * scale, yOffset + 60);
    g.lineTo(-45 * scale, yOffset + 90);
    g.lineTo(-20 * scale, yOffset + 70);
    g.closePath();
    g.fillPath();
    // Right wing
    g.beginPath();
    g.moveTo(20 * scale, yOffset + 50);
    g.lineTo(50 * scale, yOffset + 20);
    g.lineTo(60 * scale, yOffset + 60);
    g.lineTo(45 * scale, yOffset + 90);
    g.lineTo(20 * scale, yOffset + 70);
    g.closePath();
    g.fillPath();

    // Wing bones
    g.lineStyle(2, colors.secondary, 1);
    g.lineBetween(-20 * scale, yOffset + 50, -50 * scale, yOffset + 20);
    g.lineBetween(-20 * scale, yOffset + 55, -55 * scale, yOffset + 45);
    g.lineBetween(20 * scale, yOffset + 50, 50 * scale, yOffset + 20);
    g.lineBetween(20 * scale, yOffset + 55, 55 * scale, yOffset + 45);

    // Head
    const headY = yOffset + 22;
    g.fillStyle(colors.skin, 1);
    g.fillCircle(0, headY, 20 * scale);

    // Horns
    g.fillStyle(0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(-15 * scale, headY - 12 * scale);
    g.bezierCurveTo(-20 * scale, headY - 35 * scale, -30 * scale, headY - 30 * scale, -25 * scale, headY - 45 * scale);
    g.lineTo(-18 * scale, headY - 30 * scale);
    g.lineTo(-12 * scale, headY - 12 * scale);
    g.closePath();
    g.fillPath();
    g.beginPath();
    g.moveTo(15 * scale, headY - 12 * scale);
    g.bezierCurveTo(20 * scale, headY - 35 * scale, 30 * scale, headY - 30 * scale, 25 * scale, headY - 45 * scale);
    g.lineTo(18 * scale, headY - 30 * scale);
    g.lineTo(12 * scale, headY - 12 * scale);
    g.closePath();
    g.fillPath();

    // Eyes - glowing
    e.fillStyle(colors.accent, 1);
    e.fillCircle(-7 * scale, headY - 3, 5 * scale);
    e.fillCircle(7 * scale, headY - 3, 5 * scale);
    g.fillStyle(0xffff00, 1);
    g.fillCircle(-7 * scale, headY - 3, 3 * scale);
    g.fillCircle(7 * scale, headY - 3, 3 * scale);

    // Mouth
    g.fillStyle(0x1a1a1a, 1);
    g.beginPath();
    g.arc(0, headY + 8, 10 * scale, 0.2, Math.PI - 0.2, false);
    g.fillPath();

    // Fangs
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(-6 * scale, headY + 8, -4 * scale, headY + 16, -2 * scale, headY + 8);
    g.fillTriangle(6 * scale, headY + 8, 4 * scale, headY + 16, 2 * scale, headY + 8);

    // Weapon - flaming sword
    const handX = -25 * scale + Math.sin(-armAngle) * 38 * scale;
    const handY = yOffset + 50 + Math.cos(-armAngle) * 38 * scale;
    w.save();
    w.translateCanvas(handX, handY);
    w.rotateCanvas(-armAngle + Math.PI / 4);
    // Blade
    w.fillStyle(0x1a1a1a, 1);
    w.fillRect(-4, -5, 8, 55);
    w.fillTriangle(0, 55, -6, 45, 6, 45);
    // Flame effect
    w.fillStyle(colors.accent, 0.7);
    for (let i = 0; i < 5; i++) {
      const fx = Math.sin(this.animTimer * 0.01 + i) * 3;
      w.fillCircle(fx, 10 + i * 10, 6 - i * 0.5);
    }
    // Guard
    w.fillStyle(colors.primary, 1);
    w.fillRect(-12, -8, 24, 6);
    w.restore();

    // Fire particles around demon
    e.fillStyle(colors.accent, 0.4);
    for (let i = 0; i < 3; i++) {
      const px = Math.sin(this.animTimer * 0.002 + i * 2) * 40 * scale;
      const py = yOffset + 80 + Math.cos(this.animTimer * 0.003 + i * 2) * 20;
      e.fillCircle(px, py, 4);
    }
  }

  private drawBoneArm(g: Phaser.GameObjects.Graphics, x: number, y: number, length: number, angle: number): void {
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(angle);
    // Upper arm bone
    g.fillRoundedRect(-3, 0, 6, length * 0.5, 3);
    // Lower arm bone
    g.fillRoundedRect(-2, length * 0.5, 4, length * 0.5, 2);
    // Hand bones
    g.fillCircle(0, length, 4);
    g.restore();
  }

  private drawMuscularArm(g: Phaser.GameObjects.Graphics, x: number, y: number, length: number, angle: number): void {
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(angle);
    // Upper arm
    g.fillRoundedRect(-8, 0, 16, length * 0.55, 8);
    // Lower arm
    g.fillRoundedRect(-6, length * 0.5, 12, length * 0.55, 6);
    // Fist
    g.fillCircle(0, length, 8);
    g.restore();
  }

  private drawDemonArm(g: Phaser.GameObjects.Graphics, x: number, y: number, length: number, angle: number, scale: number): void {
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(angle);
    // Upper arm
    g.fillRoundedRect(-7, 0, 14, length * 0.55, 7);
    // Lower arm
    g.fillRoundedRect(-5, length * 0.5, 10, length * 0.55, 5);
    // Clawed hand
    g.fillCircle(0, length, 7);
    // Claws
    g.fillStyle(0x1a1a1a, 1);
    for (let i = -1; i <= 1; i++) {
      g.fillTriangle(
        i * 4, length + 5,
        i * 4 - 2, length + 12,
        i * 4 + 2, length + 12
      );
    }
    g.restore();
  }

  private getWeaponArmAngle(): number {
    switch (this.animState) {
      case CombatAnimState.WINDUP:
        return -1.0;
      case CombatAnimState.STRIKE:
        return 0.9;
      case CombatAnimState.RECOVER:
        return 0.5;
      case CombatAnimState.HIT:
        return 0.3;
      default:
        return 0.4 + this.armAngle;
    }
  }

  // === Public Methods ===

  public setType(type: EnemyType): void {
    this.enemyType = type;
    this.applyTypeConfig();
    this.drawCharacter();
  }

  public setAnimState(state: CombatAnimState): void {
    this.animState = state;
  }

  public takeDamage(amount: number): void {
    this.currentHP = Math.max(0, this.currentHP - amount);
  }

  public reset(): void {
    this.applyTypeConfig();
    this.animState = CombatAnimState.IDLE;
    this.setPosition(this.baseX, this.baseY);
  }

  public override setPosition(x: number, y: number): this {
    this.baseX = x;
    this.baseY = y;
    return super.setPosition(x, y);
  }

  public getType(): EnemyType {
    return this.enemyType;
  }
}
