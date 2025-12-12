/**
 * FXSystem.ts - Visual effects system
 *
 * Features:
 * - Particle effects (sparks, dust, magic)
 * - Screen shake
 * - Hit stop (micro-freeze)
 * - Slash arcs and trails
 * - Damage numbers
 */

import Phaser from 'phaser';
import type { BattleScene } from '../scenes/BattleScene';

export class FXSystem {
  private scene: BattleScene;

  constructor(scene: BattleScene) {
    this.scene = scene;
  }

  update(time: number, delta: number): void {
    // Particle systems auto-update via Phaser
  }

  /**
   * Basic hit effect with particles and damage number
   */
  playHitEffect(x: number, y: number, damage: number, isCrit: boolean): void {
    // Spark particles
    if (this.scene.textures.exists('spark')) {
      const sparks = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 100, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 300,
        quantity: isCrit ? 15 : 8,
        tint: isCrit ? [0xffd700, 0xff6600] : [0xffffff, 0xffcc00],
        blendMode: Phaser.BlendModes.ADD,
      });

      this.scene.time.delayedCall(400, () => sparks.destroy());
    }

    // Damage number
    this.showDamageNumber(x, y - 20, damage, isCrit);

    // Flash effect
    this.playFlash(x, y, isCrit ? 0xffd700 : 0xffffff, isCrit ? 40 : 25);
  }

  /**
   * Show floating damage number
   */
  showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.scene.add.text(x, y, damage.toString(), {
      fontFamily: 'Cinzel, serif',
      fontSize: isCrit ? '32px' : '24px',
      color: isCrit ? '#ffd700' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    // Animate up and fade
    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: isCrit ? 1.5 : 1.2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Screen shake effect
   */
  screenShake(intensity: number = 5, duration: number = 100): void {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  /**
   * Flash effect at position
   */
  playFlash(x: number, y: number, color: number = 0xffffff, radius: number = 30): void {
    const flash = this.scene.add.graphics();
    flash.fillStyle(color, 0.8);
    flash.fillCircle(x, y, radius);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    flash.setDepth(50);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.5,
      duration: 150,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Warrior slash arc effect
   */
  playSlashEffect(x: number, y: number): void {
    if (!this.scene.textures.exists('slash-arc')) return;

    const slash = this.scene.add.image(x, y, 'slash-arc');
    slash.setTint(0xffffff);
    slash.setAlpha(0.9);
    slash.setScale(1.5);
    slash.setBlendMode(Phaser.BlendModes.ADD);
    slash.setDepth(45);
    slash.setRotation(-0.3);

    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      rotation: 0.5,
      scale: 2,
      duration: 200,
      ease: 'Power2',
      onComplete: () => slash.destroy(),
    });
  }

  /**
   * Dust/debris effect
   */
  playDustEffect(x: number, y: number): void {
    if (!this.scene.textures.exists('particle')) return;

    const dust = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 30, max: 80 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: [0x8b7355, 0x6b5344, 0x5a4535],
      gravityY: 100,
    });

    this.scene.time.delayedCall(600, () => dust.destroy());
  }

  /**
   * Rogue dash/afterimage effect
   */
  playDashEffect(fromX: number, fromY: number, toX: number, toY: number): void {
    // Create afterimages
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = Phaser.Math.Linear(fromX, toX, t);
      const y = Phaser.Math.Linear(fromY, toY, t);

      this.scene.time.delayedCall(i * 30, () => {
        const ghost = this.scene.add.graphics();
        ghost.fillStyle(0x404040, 0.5 - t * 0.4);
        ghost.fillEllipse(x, y, 30, 60);
        ghost.setDepth(8);

        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 200,
          onComplete: () => ghost.destroy(),
        });
      });
    }

    // Speed lines
    const lines = this.scene.add.graphics();
    lines.lineStyle(2, 0xffffff, 0.5);
    for (let i = 0; i < 5; i++) {
      const offset = Phaser.Math.Between(-20, 20);
      lines.lineBetween(fromX + offset, fromY, toX + offset, toY);
    }
    lines.setBlendMode(Phaser.BlendModes.ADD);
    lines.setDepth(7);

    this.scene.tweens.add({
      targets: lines,
      alpha: 0,
      duration: 150,
      onComplete: () => lines.destroy(),
    });
  }

  /**
   * Mage magic orb projectile
   */
  playMagicOrbEffect(fromX: number, fromY: number, toX: number, toY: number): void {
    if (!this.scene.textures.exists('magic-orb')) return;

    const orb = this.scene.add.image(fromX, fromY, 'magic-orb');
    orb.setScale(0.8);
    orb.setBlendMode(Phaser.BlendModes.ADD);
    orb.setDepth(50);

    // Trail particles
    const trail = this.scene.add.particles(fromX, fromY, 'particle', {
      speed: 20,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 300,
      frequency: 20,
      tint: [0x9b6dcc, 0x6b3fa0],
      blendMode: Phaser.BlendModes.ADD,
      follow: orb,
    });

    this.scene.tweens.add({
      targets: orb,
      x: toX,
      y: toY,
      duration: 300,
      ease: 'Power1',
      onComplete: () => {
        // Impact
        this.playFlash(toX, toY, 0x9b6dcc, 50);
        orb.destroy();
        trail.destroy();
      },
    });
  }

  /**
   * Mage rune circle effect
   */
  playRuneCircleEffect(x: number, y: number): void {
    if (!this.scene.textures.exists('rune-circle')) return;

    const rune = this.scene.add.image(x, y, 'rune-circle');
    rune.setAlpha(0);
    rune.setScale(0.5);
    rune.setTint(0x9b6dcc);
    rune.setBlendMode(Phaser.BlendModes.ADD);
    rune.setDepth(5);

    this.scene.tweens.add({
      targets: rune,
      alpha: 0.8,
      scale: 1.2,
      rotation: Math.PI,
      duration: 400,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => rune.destroy(),
    });
  }

  /**
   * Paladin smite effect (holy light from above)
   */
  playSmiteEffect(x: number, y: number): void {
    if (!this.scene.textures.exists('smite')) return;

    // Light beam
    const beam = this.scene.add.graphics();
    beam.fillStyle(0xf5e642, 0.4);
    beam.fillRect(x - 15, -50, 30, y + 100);
    beam.setBlendMode(Phaser.BlendModes.ADD);
    beam.setDepth(40);

    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 400,
      onComplete: () => beam.destroy(),
    });

    // Smite impact
    const smite = this.scene.add.image(x, y, 'smite');
    smite.setScale(0);
    smite.setTint(0xffd700);
    smite.setBlendMode(Phaser.BlendModes.ADD);
    smite.setDepth(45);

    this.scene.tweens.add({
      targets: smite,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => smite.destroy(),
    });

    // Holy particles
    if (this.scene.textures.exists('particle')) {
      const particles = this.scene.add.particles(x, y, 'particle', {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 500,
        quantity: 12,
        tint: [0xffd700, 0xf5e642, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
      });

      this.scene.time.delayedCall(600, () => particles.destroy());
    }
  }

  /**
   * Paladin holy glow aura
   */
  playHolyGlowEffect(x: number, y: number): void {
    const glow = this.scene.add.graphics();
    glow.fillStyle(0xffd700, 0.3);
    glow.fillCircle(x, y, 60);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(9);

    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => glow.destroy(),
    });
  }

  /**
   * Ranger arrow projectile
   */
  playArrowEffect(fromX: number, fromY: number, toX: number, toY: number): void {
    if (!this.scene.textures.exists('arrow')) return;

    const arrow = this.scene.add.image(fromX, fromY, 'arrow');
    arrow.setScale(1.5);
    arrow.setDepth(50);

    // Calculate angle
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    arrow.setRotation(angle);

    this.scene.tweens.add({
      targets: arrow,
      x: toX,
      y: toY,
      duration: 200,
      ease: 'Power1',
      onComplete: () => {
        // Impact
        this.playFlash(toX, toY, 0x8b4513, 20);
        arrow.destroy();
      },
    });
  }

  /**
   * Miss effect (whoosh)
   */
  playMissEffect(x: number, y: number): void {
    // "MISS" text
    const missText = this.scene.add.text(x, y, 'MISS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '20px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3,
    });
    missText.setOrigin(0.5);
    missText.setDepth(100);

    this.scene.tweens.add({
      targets: missText,
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => missText.destroy(),
    });

    // Whoosh lines
    const whoosh = this.scene.add.graphics();
    whoosh.lineStyle(2, 0x888888, 0.5);
    whoosh.beginPath();
    whoosh.arc(x, y, 30, 0, Math.PI, false);
    whoosh.strokePath();
    whoosh.setDepth(45);

    this.scene.tweens.add({
      targets: whoosh,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => whoosh.destroy(),
    });
  }

  /**
   * Hit stop effect (micro-freeze)
   */
  hitStop(duration: number = 80): void {
    // Pause the scene briefly
    this.scene.time.timeScale = 0.1;

    this.scene.time.delayedCall(duration * 0.1, () => {
      this.scene.time.timeScale = 1;
    });
  }
}
