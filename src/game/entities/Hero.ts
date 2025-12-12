/**
 * Hero.ts - Playable hero character with procedural rendering
 *
 * Features:
 * - Multi-part body (head, torso, arms, legs) drawn with Graphics
 * - Class-based visual differences
 * - Gender and glamour variations
 * - Combat animations with anticipation and follow-through
 */

import Phaser from 'phaser';
import type { BattleScene } from '../scenes/BattleScene';
import { HeroClass } from '../systems/CombatSystem';

// Combat states for animation
export enum CombatAnimState {
  IDLE = 'idle',
  WINDUP = 'windup',
  STRIKE = 'strike',
  RECOVER = 'recover',
  HIT = 'hit',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
}

// Class color palettes
const CLASS_COLORS: Record<HeroClass, { primary: number; secondary: number; accent: number }> = {
  warrior: { primary: 0x8b4513, secondary: 0xa0522d, accent: 0xcd853f },
  rogue: { primary: 0x2f2f2f, secondary: 0x404040, accent: 0x708090 },
  mage: { primary: 0x4a2870, secondary: 0x6b3fa0, accent: 0x9b6dcc },
  paladin: { primary: 0xc0c0c0, secondary: 0xdaa520, accent: 0xffd700 },
  ranger: { primary: 0x228b22, secondary: 0x2e8b57, accent: 0x8b4513 },
};

export class Hero extends Phaser.GameObjects.Container {
  public scene: BattleScene;

  // Stats
  public maxHP = 100;
  public currentHP = 100;

  // State
  private heroClass: HeroClass = 'warrior';
  private gender: 'masculine' | 'feminine' = 'masculine';
  private glamour = 50;
  public animState: CombatAnimState = CombatAnimState.IDLE;

  // Body parts (Graphics objects)
  private bodyGraphics!: Phaser.GameObjects.Graphics;
  private weaponGraphics!: Phaser.GameObjects.Graphics;
  private effectsGraphics!: Phaser.GameObjects.Graphics;

  // Animation
  private animTimer = 0;
  private bobOffset = 0;
  private armAngle = 0;
  private legOffset = 0;

  // Position tracking for animation
  private baseX: number;
  private baseY: number;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;

    // Create graphics objects
    this.bodyGraphics = scene.add.graphics();
    this.weaponGraphics = scene.add.graphics();
    this.effectsGraphics = scene.add.graphics();

    // Add to container
    this.add([this.effectsGraphics, this.bodyGraphics, this.weaponGraphics]);

    // Add container to scene
    scene.add.existing(this);
    this.setDepth(10);

    // Initial draw
    this.drawCharacter();
  }

  update(time: number, delta: number): void {
    this.animTimer += delta;

    // Idle breathing/bob animation
    if (this.animState === CombatAnimState.IDLE) {
      this.bobOffset = Math.sin(this.animTimer * 0.003) * 2;
      this.armAngle = Math.sin(this.animTimer * 0.002) * 0.05;
      this.legOffset = Math.sin(this.animTimer * 0.004) * 1;
    }

    // Redraw character with animation offsets
    this.drawCharacter();
  }

  private drawCharacter(): void {
    const g = this.bodyGraphics;
    const w = this.weaponGraphics;
    const e = this.effectsGraphics;

    g.clear();
    w.clear();
    e.clear();

    const colors = CLASS_COLORS[this.heroClass];
    const isFeminine = this.gender === 'feminine';
    const glamourFactor = this.glamour / 100;

    // Scale based on glamour (more heroic = slightly larger)
    const scale = 0.9 + glamourFactor * 0.2;
    const heightMod = isFeminine ? 0.95 : 1;

    // Body dimensions
    const headRadius = 18 * scale;
    const torsoWidth = (isFeminine ? 28 : 35) * scale;
    const torsoHeight = 45 * scale * heightMod;
    const shoulderWidth = (isFeminine ? 32 : 40) * scale;
    const hipWidth = (isFeminine ? 30 : 28) * scale;
    const armLength = 35 * scale;
    const legLength = 50 * scale;

    // Position offsets (centered at feet)
    const totalHeight = headRadius * 2 + torsoHeight + legLength;
    const yOffset = -totalHeight + this.bobOffset;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 5, 50 * scale, 15);

    // === LEGS ===
    const legY = yOffset + headRadius * 2 + torsoHeight;
    const legSpacing = hipWidth * 0.35;

    // Left leg
    g.fillStyle(colors.primary, 1);
    this.drawLimb(g, -legSpacing, legY, 8 * scale, legLength + this.legOffset, 0.1 + this.armAngle);

    // Right leg
    this.drawLimb(g, legSpacing, legY, 8 * scale, legLength - this.legOffset, -0.1 - this.armAngle);

    // Boots
    g.fillStyle(colors.secondary, 1);
    g.fillRoundedRect(-legSpacing - 8, legY + legLength - 8, 16, 12, 4);
    g.fillRoundedRect(legSpacing - 8, legY + legLength - 8, 16, 12, 4);

    // === TORSO ===
    const torsoY = yOffset + headRadius * 2;

    // Body base
    g.fillStyle(colors.primary, 1);
    g.beginPath();
    g.moveTo(-shoulderWidth / 2, torsoY);
    g.lineTo(shoulderWidth / 2, torsoY);
    g.lineTo(hipWidth / 2, torsoY + torsoHeight);
    g.lineTo(-hipWidth / 2, torsoY + torsoHeight);
    g.closePath();
    g.fillPath();

    // Armor/clothing details based on class
    this.drawClassArmor(g, torsoY, torsoWidth, torsoHeight, colors, glamourFactor, isFeminine);

    // === ARMS ===
    const armY = torsoY + 5;

    // Back arm
    g.fillStyle(colors.primary, 1);
    this.drawLimb(g, -shoulderWidth / 2, armY, 7 * scale, armLength, -0.3 + this.armAngle);

    // Front arm (weapon arm)
    g.fillStyle(colors.primary, 1);
    const weaponArmAngle = this.getWeaponArmAngle();
    this.drawLimb(g, shoulderWidth / 2, armY, 7 * scale, armLength, weaponArmAngle);

    // === WEAPON ===
    const handX = shoulderWidth / 2 + Math.sin(weaponArmAngle) * armLength;
    const handY = armY + Math.cos(weaponArmAngle) * armLength;
    this.drawWeapon(w, handX, handY, weaponArmAngle);

    // === HEAD ===
    const headY = yOffset + headRadius;

    // Neck
    g.fillStyle(0xd4a574, 1);
    g.fillRect(-6, headY + headRadius - 5, 12, 10);

    // Head base (skin)
    const skinTone = isFeminine ? 0xe8c4a0 : 0xd4a574;
    g.fillStyle(skinTone, 1);
    g.fillCircle(0, headY, headRadius);

    // Face
    this.drawFace(g, headY, headRadius, isFeminine);

    // Hair/Helmet based on class
    this.drawHeadgear(g, headY, headRadius, colors, glamourFactor, isFeminine);

    // === CLASS EFFECTS ===
    this.drawClassEffects(e, yOffset, totalHeight, colors, glamourFactor);

    // === HIT FLASH ===
    if (this.animState === CombatAnimState.HIT) {
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(-40, yOffset, 80, totalHeight + 10);
    }
  }

  private drawLimb(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, length: number, angle: number): void {
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(angle);
    g.fillRoundedRect(-width / 2, 0, width, length, width / 2);
    g.restore();
  }

  private getWeaponArmAngle(): number {
    switch (this.animState) {
      case CombatAnimState.WINDUP:
        return -1.2; // Arm pulled back
      case CombatAnimState.STRIKE:
        return 0.8; // Arm swinging forward
      case CombatAnimState.RECOVER:
        return 0.4;
      case CombatAnimState.HIT:
        return 0.2;
      default:
        return 0.3 + this.armAngle; // Idle position
    }
  }

  private drawWeapon(w: Phaser.GameObjects.Graphics, x: number, y: number, angle: number): void {
    w.save();
    w.translateCanvas(x, y);
    w.rotateCanvas(angle - Math.PI / 4);

    switch (this.heroClass) {
      case 'warrior':
        // Sword
        w.fillStyle(0x808080, 1);
        w.fillRect(-3, -5, 6, 50);
        w.fillStyle(0xc0c0c0, 1);
        w.fillRect(-2, 0, 4, 45);
        // Guard
        w.fillStyle(0x8b4513, 1);
        w.fillRect(-10, -8, 20, 6);
        // Pommel
        w.fillStyle(0xffd700, 1);
        w.fillCircle(0, -12, 4);
        break;

      case 'rogue':
        // Daggers
        w.fillStyle(0x404040, 1);
        w.fillRect(-2, -3, 4, 30);
        w.fillStyle(0xc0c0c0, 1);
        w.fillTriangle(0, 30, -3, 25, 3, 25);
        break;

      case 'mage':
        // Staff
        w.fillStyle(0x654321, 1);
        w.fillRect(-3, -10, 6, 70);
        // Crystal
        w.fillStyle(0x9b6dcc, 1);
        w.fillCircle(0, -15, 8);
        w.fillStyle(0xffffff, 0.5);
        w.fillCircle(-2, -17, 3);
        break;

      case 'paladin':
        // Mace/Hammer
        w.fillStyle(0x8b4513, 1);
        w.fillRect(-3, -5, 6, 40);
        w.fillStyle(0xc0c0c0, 1);
        w.fillRect(-10, 35, 20, 15);
        w.fillStyle(0xffd700, 1);
        w.fillRect(-8, 37, 16, 3);
        break;

      case 'ranger':
        // Bow
        w.lineStyle(4, 0x8b4513, 1);
        w.beginPath();
        w.arc(0, 20, 30, -Math.PI * 0.7, Math.PI * 0.7, false);
        w.strokePath();
        // String
        w.lineStyle(1, 0xf5f5dc, 1);
        w.lineBetween(0, -10, 0, 50);
        break;
    }

    w.restore();
  }

  private drawFace(g: Phaser.GameObjects.Graphics, headY: number, radius: number, isFeminine: boolean): void {
    // Eyes
    g.fillStyle(0x2d2a32, 1);
    const eyeY = headY - radius * 0.15;
    const eyeSpacing = radius * 0.35;
    const eyeSize = isFeminine ? 3 : 2.5;
    g.fillCircle(-eyeSpacing, eyeY, eyeSize);
    g.fillCircle(eyeSpacing, eyeY, eyeSize);

    // Eye shine
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(-eyeSpacing + 1, eyeY - 1, 1);
    g.fillCircle(eyeSpacing + 1, eyeY - 1, 1);

    // Eyebrows (less prominent for feminine)
    if (!isFeminine) {
      g.lineStyle(2, 0x4a3728, 1);
      g.lineBetween(-eyeSpacing - 4, eyeY - 5, -eyeSpacing + 4, eyeY - 4);
      g.lineBetween(eyeSpacing - 4, eyeY - 4, eyeSpacing + 4, eyeY - 5);
    }

    // Mouth
    g.lineStyle(isFeminine ? 2 : 1.5, isFeminine ? 0xc27070 : 0x8b6060, 1);
    g.beginPath();
    g.arc(0, headY + radius * 0.35, radius * 0.2, 0.2, Math.PI - 0.2, false);
    g.strokePath();
  }

  private drawHeadgear(g: Phaser.GameObjects.Graphics, headY: number, radius: number, colors: { primary: number; secondary: number; accent: number }, glamour: number, isFeminine: boolean): void {
    switch (this.heroClass) {
      case 'warrior':
        // Helmet
        g.fillStyle(colors.secondary, 1);
        g.fillCircle(0, headY - 3, radius + 2);
        g.fillStyle(colors.primary, 1);
        g.fillRect(-radius - 2, headY - 3, (radius + 2) * 2, radius + 3);
        // Helmet crest
        if (glamour > 0.5) {
          g.fillStyle(0xcc0000, 1);
          g.fillRect(-2, headY - radius - 15, 4, 20);
          for (let i = 0; i < 5; i++) {
            g.fillCircle(0, headY - radius - 15 + i * 2, 3 - i * 0.3);
          }
        }
        break;

      case 'rogue':
        // Hood
        g.fillStyle(colors.primary, 1);
        g.beginPath();
        g.arc(0, headY, radius + 5, -Math.PI, 0, false);
        g.lineTo(radius + 8, headY + 5);
        g.lineTo(-radius - 8, headY + 5);
        g.closePath();
        g.fillPath();
        break;

      case 'mage':
        // Wizard hat
        g.fillStyle(colors.primary, 1);
        g.fillTriangle(0, headY - radius - 30, -radius - 5, headY - radius + 5, radius + 5, headY - radius + 5);
        g.fillStyle(colors.accent, 1);
        g.fillRect(-radius - 8, headY - radius + 3, (radius + 8) * 2, 5);
        // Star on hat
        if (glamour > 0.3) {
          g.fillStyle(0xffd700, 1);
          g.fillStar(0, headY - radius - 15, 5, 4, 2, 0);
        }
        break;

      case 'paladin':
        // Crown/circlet
        g.fillStyle(colors.accent, 1);
        g.fillRect(-radius, headY - radius - 2, radius * 2, 8);
        // Spikes
        for (let i = 0; i < 5; i++) {
          const sx = -radius + 5 + i * ((radius * 2 - 10) / 4);
          g.fillTriangle(sx, headY - radius - 2, sx - 3, headY - radius - 2, sx, headY - radius - 10 - (i === 2 ? 5 : 0));
        }
        // Hair
        g.fillStyle(isFeminine ? 0xffd700 : 0x8b4513, 1);
        g.fillEllipse(0, headY - radius * 0.3, radius * 0.9, radius * 0.7);
        break;

      case 'ranger':
        // Hair with leaves/nature elements
        g.fillStyle(isFeminine ? 0x8b4513 : 0x4a3728, 1);
        g.fillEllipse(0, headY - radius * 0.4, radius * 0.8, radius * 0.6);
        // Leaf headband
        g.fillStyle(0x228b22, 1);
        g.fillRect(-radius - 2, headY - radius * 0.7, (radius + 2) * 2, 4);
        // Feather
        if (glamour > 0.4) {
          g.fillStyle(0x8b0000, 1);
          g.beginPath();
          g.moveTo(radius, headY - radius * 0.7);
          g.lineTo(radius + 15, headY - radius - 10);
          g.lineTo(radius + 5, headY - radius * 0.5);
          g.closePath();
          g.fillPath();
        }
        break;
    }
  }

  private drawClassArmor(g: Phaser.GameObjects.Graphics, torsoY: number, torsoWidth: number, torsoHeight: number, colors: { primary: number; secondary: number; accent: number }, glamour: number, isFeminine: boolean): void {
    const centerX = 0;

    switch (this.heroClass) {
      case 'warrior':
        // Chest plate
        g.fillStyle(colors.secondary, 1);
        g.fillRoundedRect(-torsoWidth / 2 + 2, torsoY + 5, torsoWidth - 4, torsoHeight * 0.6, 5);
        // Belt
        g.fillStyle(0x8b4513, 1);
        g.fillRect(-torsoWidth / 2, torsoY + torsoHeight * 0.65, torsoWidth, 8);
        g.fillStyle(colors.accent, 1);
        g.fillRect(-6, torsoY + torsoHeight * 0.65, 12, 8);
        break;

      case 'rogue':
        // Leather vest
        g.fillStyle(colors.secondary, 1);
        g.fillRect(-torsoWidth / 2 + 3, torsoY + 8, torsoWidth - 6, torsoHeight * 0.5);
        // Straps
        g.lineStyle(3, colors.accent, 1);
        g.lineBetween(-torsoWidth / 3, torsoY + 10, -torsoWidth / 3, torsoY + torsoHeight * 0.6);
        g.lineBetween(torsoWidth / 3, torsoY + 10, torsoWidth / 3, torsoY + torsoHeight * 0.6);
        break;

      case 'mage':
        // Robe collar
        g.fillStyle(colors.secondary, 1);
        g.beginPath();
        g.moveTo(-torsoWidth / 2 - 5, torsoY + 3);
        g.lineTo(0, torsoY + 25);
        g.lineTo(torsoWidth / 2 + 5, torsoY + 3);
        g.closePath();
        g.fillPath();
        // Mystical symbol
        if (glamour > 0.3) {
          g.lineStyle(2, colors.accent, 0.8);
          g.strokeCircle(0, torsoY + torsoHeight * 0.4, 10);
          g.fillStyle(colors.accent, 0.6);
          g.fillStar(0, torsoY + torsoHeight * 0.4, 5, 6, 3, 0);
        }
        break;

      case 'paladin':
        // Plate armor
        g.fillStyle(colors.primary, 1);
        g.fillRoundedRect(-torsoWidth / 2 + 2, torsoY + 5, torsoWidth - 4, torsoHeight * 0.65, 5);
        // Holy symbol
        g.fillStyle(colors.accent, 1);
        g.fillRect(-3, torsoY + 15, 6, 25);
        g.fillRect(-10, torsoY + 22, 20, 6);
        // Shoulder pads
        g.fillStyle(colors.secondary, 1);
        g.fillEllipse(-torsoWidth / 2 - 5, torsoY + 8, 15, 10);
        g.fillEllipse(torsoWidth / 2 + 5, torsoY + 8, 15, 10);
        break;

      case 'ranger':
        // Leather armor with nature motif
        g.fillStyle(colors.secondary, 1);
        g.fillRoundedRect(-torsoWidth / 2 + 3, torsoY + 8, torsoWidth - 6, torsoHeight * 0.55, 3);
        // Cape/cloak hint
        if (glamour > 0.4) {
          g.fillStyle(colors.primary, 0.7);
          g.beginPath();
          g.moveTo(-torsoWidth / 2 - 10, torsoY);
          g.lineTo(-torsoWidth / 2 - 15, torsoY + torsoHeight + 20);
          g.lineTo(-torsoWidth / 2, torsoY + torsoHeight);
          g.closePath();
          g.fillPath();
        }
        // Quiver hint
        g.fillStyle(0x8b4513, 1);
        g.fillRect(-torsoWidth / 2 - 8, torsoY + 10, 6, 30);
        break;
    }
  }

  private drawClassEffects(e: Phaser.GameObjects.Graphics, yOffset: number, totalHeight: number, colors: { primary: number; secondary: number; accent: number }, glamour: number): void {
    if (glamour < 0.3) return;

    const alpha = 0.3 + glamour * 0.4;

    switch (this.heroClass) {
      case 'mage':
        // Magical aura
        e.lineStyle(2, colors.accent, alpha * 0.5);
        e.strokeCircle(0, yOffset + totalHeight / 2, 50 + Math.sin(this.animTimer * 0.005) * 5);
        break;

      case 'paladin':
        // Holy glow
        e.fillStyle(colors.accent, alpha * 0.2);
        e.fillCircle(0, yOffset + totalHeight / 2, 45);
        break;

      case 'rogue':
        // Shadow wisps
        if (this.animState === CombatAnimState.IDLE) {
          e.fillStyle(0x000000, alpha * 0.3);
          for (let i = 0; i < 3; i++) {
            const wx = Math.sin(this.animTimer * 0.003 + i) * 30;
            const wy = yOffset + totalHeight - 10 + Math.cos(this.animTimer * 0.004 + i) * 10;
            e.fillCircle(wx, wy, 5);
          }
        }
        break;
    }
  }

  // === Public Methods ===

  public setClass(heroClass: HeroClass): void {
    this.heroClass = heroClass;
    this.drawCharacter();
  }

  public setGender(gender: 'masculine' | 'feminine'): void {
    this.gender = gender;
    this.drawCharacter();
  }

  public setGlamour(glamour: number): void {
    this.glamour = Phaser.Math.Clamp(glamour, 0, 100);
    this.drawCharacter();
  }

  public setAnimState(state: CombatAnimState): void {
    this.animState = state;
  }

  public takeDamage(amount: number): void {
    this.currentHP = Math.max(0, this.currentHP - amount);
  }

  public reset(): void {
    this.currentHP = this.maxHP;
    this.animState = CombatAnimState.IDLE;
    this.setPosition(this.baseX, this.baseY);
  }

  public override setPosition(x: number, y: number): this {
    this.baseX = x;
    this.baseY = y;
    return super.setPosition(x, y);
  }

  public getClass(): HeroClass {
    return this.heroClass;
  }
}
