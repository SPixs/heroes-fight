/**
 * BattleScene.ts - Main battle scene
 *
 * Handles the combat loop, character rendering, and animations
 */

import Phaser from 'phaser';
import { Hero } from '../entities/Hero';
import { Enemy } from '../entities/Enemy';
import { CombatSystem, CombatState, HeroClass, EnemyType } from '../systems/CombatSystem';
import { FXSystem } from '../systems/FXSystem';
import type { GameStore } from '../../ui/ui';

export class BattleScene extends Phaser.Scene {
  // Entities
  public hero!: Hero;
  public enemy!: Enemy;

  // Systems
  public combatSystem!: CombatSystem;
  public fxSystem!: FXSystem;

  // Scene elements
  private background!: Phaser.GameObjects.Graphics;
  private floor!: Phaser.GameObjects.Graphics;
  private torchParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // State
  private isPaused = true;
  private isGameOver = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    // Get canvas dimensions
    const { width, height } = this.cameras.main;

    // Create background
    this.createBackground(width, height);

    // Initialize FX system first (needed by entities)
    this.fxSystem = new FXSystem(this);

    // Create entities
    const heroX = width * 0.3;
    const enemyX = width * 0.7;
    const groundY = height * 0.7;

    this.hero = new Hero(this, heroX, groundY);
    this.enemy = new Enemy(this, enemyX, groundY);

    // Initialize combat system
    this.combatSystem = new CombatSystem(this, this.hero, this.enemy);

    // Setup camera effects
    this.cameras.main.setBackgroundColor('#1a181d');

    // Handle resize
    this.scale.on('resize', this.handleResize, this);

    // Create torch particles for ambiance
    this.createTorchEffects(width, height);

    console.log('⚔️ Battle Scene initialized');
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return;

    // Update combat system
    if (!this.isPaused) {
      this.combatSystem.update(time, delta);
    }

    // Update entities
    this.hero.update(time, delta);
    this.enemy.update(time, delta);

    // Update FX
    this.fxSystem.update(time, delta);

    // Update UI health bars
    this.updateHealthBars();

    // Check for game over
    this.checkGameOver();
  }

  private createBackground(width: number, height: number): void {
    // Dungeon background gradient
    this.background = this.add.graphics();
    this.background.fillGradientStyle(
      0x2d2a32, 0x2d2a32,
      0x1a181d, 0x1a181d,
      1
    );
    this.background.fillRect(0, 0, width, height);

    // Stone floor
    this.floor = this.add.graphics();
    this.floor.fillStyle(0x3a3540, 1);
    this.floor.fillRect(0, height * 0.72, width, height * 0.3);

    // Floor stones pattern
    this.floor.lineStyle(1, 0x2d2a32, 0.5);
    const stoneWidth = 80;
    const stoneHeight = 40;
    for (let y = height * 0.72; y < height; y += stoneHeight) {
      const offset = ((y / stoneHeight) % 2) * (stoneWidth / 2);
      for (let x = -stoneWidth / 2 + offset; x < width + stoneWidth; x += stoneWidth) {
        this.floor.strokeRect(x, y, stoneWidth, stoneHeight);
      }
    }

    // Add some floor cracks/details
    this.floor.lineStyle(1, 0x1a181d, 0.3);
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height * 0.75, height);
      this.floor.lineBetween(x, y, x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-10, 10));
    }

    // Ambient shadows from sides
    const shadowGraphics = this.add.graphics();
    shadowGraphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.4, 0.4, 0, 0);
    shadowGraphics.fillRect(0, 0, width * 0.15, height);
    shadowGraphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.4, 0.4);
    shadowGraphics.fillRect(width * 0.85, 0, width * 0.15, height);

    // Depth level indicator
    this.background.setDepth(-10);
    this.floor.setDepth(-5);
    shadowGraphics.setDepth(100);
  }

  private createTorchEffects(width: number, height: number): void {
    // Left torch
    this.createTorch(width * 0.1, height * 0.3);
    // Right torch
    this.createTorch(width * 0.9, height * 0.3);
  }

  private createTorch(x: number, y: number): void {
    // Torch holder
    const torch = this.add.graphics();
    torch.fillStyle(0x4a3728, 1);
    torch.fillRect(x - 5, y, 10, 30);
    torch.fillStyle(0x654321, 1);
    torch.fillRect(x - 8, y - 5, 16, 10);

    // Flame particles
    if (this.textures.exists('particle')) {
      const particles = this.add.particles(x, y - 10, 'particle', {
        speed: { min: 20, max: 50 },
        angle: { min: 260, max: 280 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 800,
        frequency: 50,
        tint: [0xff6600, 0xff9900, 0xffcc00],
        blendMode: Phaser.BlendModes.ADD,
      });
      particles.setDepth(5);
    }

    // Glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0xff6600, 0.1);
    glow.fillCircle(x, y - 10, 60);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    // Animate glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;

    // Recreate background
    if (this.background) {
      this.background.clear();
      this.background.fillGradientStyle(0x2d2a32, 0x2d2a32, 0x1a181d, 0x1a181d, 1);
      this.background.fillRect(0, 0, width, height);
    }

    // Reposition entities
    if (this.hero) {
      this.hero.setPosition(width * 0.3, height * 0.7);
    }
    if (this.enemy) {
      this.enemy.setPosition(width * 0.7, height * 0.7);
    }
  }

  private updateHealthBars(): void {
    // Get DOM elements
    const heroHealthBar = document.getElementById('hero-health-bar');
    const enemyHealthBar = document.getElementById('enemy-health-bar');
    const heroHpText = document.getElementById('hero-hp');
    const enemyHpText = document.getElementById('enemy-hp');

    if (heroHealthBar && this.hero) {
      const heroPercent = (this.hero.currentHP / this.hero.maxHP) * 100;
      heroHealthBar.style.width = `${Math.max(0, heroPercent)}%`;
    }
    if (enemyHealthBar && this.enemy) {
      const enemyPercent = (this.enemy.currentHP / this.enemy.maxHP) * 100;
      enemyHealthBar.style.width = `${Math.max(0, enemyPercent)}%`;
    }
    if (heroHpText && this.hero) {
      heroHpText.textContent = `${Math.max(0, Math.ceil(this.hero.currentHP))}/${this.hero.maxHP}`;
    }
    if (enemyHpText && this.enemy) {
      enemyHpText.textContent = `${Math.max(0, Math.ceil(this.enemy.currentHP))}/${this.enemy.maxHP}`;
    }
  }

  private checkGameOver(): void {
    if (this.hero.currentHP <= 0) {
      this.gameOver(false);
    } else if (this.enemy.currentHP <= 0) {
      this.gameOver(true);
    }
  }

  private gameOver(victory: boolean): void {
    this.isGameOver = true;
    this.isPaused = true;

    // Show result modal
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const text = document.getElementById('result-text');
    const modalContent = modal?.querySelector('.modal-content');

    if (modal && title && text) {
      modal.classList.remove('hidden');

      if (victory) {
        title.textContent = 'VICTORY!';
        text.textContent = 'The hero stands triumphant!';
        modalContent?.classList.remove('defeat');
        this.addLogEntry('🏆 Victory! The enemy has been vanquished!', 'victory');
      } else {
        title.textContent = 'DEFEAT';
        text.textContent = 'The hero has fallen...';
        modalContent?.classList.add('defeat');
        this.addLogEntry('💀 Defeat! The hero has fallen...', 'defeat');
      }
    }

    // Update fight button
    const fightBtn = document.getElementById('fight-btn');
    if (fightBtn) {
      fightBtn.classList.remove('paused');
      const btnText = fightBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'FIGHT';
    }
  }

  // Public methods for UI control
  public togglePause(): void {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;

    const fightBtn = document.getElementById('fight-btn');
    if (fightBtn) {
      const btnText = fightBtn.querySelector('.btn-text');
      if (this.isPaused) {
        fightBtn.classList.remove('paused');
        if (btnText) btnText.textContent = 'FIGHT';
      } else {
        fightBtn.classList.add('paused');
        if (btnText) btnText.textContent = 'PAUSE';

        // Log combat start if fresh battle
        if (this.hero.currentHP === this.hero.maxHP && this.enemy.currentHP === this.enemy.maxHP) {
          this.addLogEntry('⚔️ Battle begins!', 'system');
        }
      }
    }
  }

  public resetBattle(): void {
    this.isGameOver = false;
    this.isPaused = true;

    // Reset entities
    this.hero.reset();
    this.enemy.reset();

    // Reset combat system
    this.combatSystem.reset();

    // Clear combat log
    const logContent = document.getElementById('log-content');
    if (logContent) {
      logContent.innerHTML = '<p class="log-entry system">Prepare for battle...</p>';
    }

    // Hide result modal
    const modal = document.getElementById('result-modal');
    if (modal) {
      modal.classList.add('hidden');
    }

    // Reset fight button
    const fightBtn = document.getElementById('fight-btn');
    if (fightBtn) {
      fightBtn.classList.remove('paused');
      const btnText = fightBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'FIGHT';
    }

    // Reset health bar display
    this.updateHealthBars();

    console.log('🔄 Battle reset');
  }

  public setHeroClass(heroClass: HeroClass): void {
    this.hero.setClass(heroClass);
    this.combatSystem.setHeroClass(heroClass);

    // Update UI class name
    const heroNameEl = document.getElementById('hero-name');
    if (heroNameEl) {
      heroNameEl.textContent = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
    }
  }

  public setHeroGender(gender: 'masculine' | 'feminine'): void {
    this.hero.setGender(gender);
  }

  public setHeroGlamour(glamour: number): void {
    this.hero.setGlamour(glamour);
  }

  public setEnemyType(enemyType: EnemyType): void {
    this.enemy.setType(enemyType);
    this.combatSystem.setEnemyType(enemyType);

    // Update UI enemy name
    const enemyNameEl = document.getElementById('enemy-name');
    if (enemyNameEl) {
      enemyNameEl.textContent = enemyType.charAt(0).toUpperCase() + enemyType.slice(1);
    }
  }

  public addLogEntry(message: string, type: 'system' | 'hero-action' | 'enemy-action' | 'critical' | 'victory' | 'defeat' = 'system'): void {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;

    const entry = document.createElement('p');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    logContent.appendChild(entry);

    // Auto-scroll to bottom
    logContent.scrollTop = logContent.scrollHeight;

    // Limit log entries
    while (logContent.children.length > 50) {
      logContent.removeChild(logContent.firstChild!);
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getIsGameOver(): boolean {
    return this.isGameOver;
  }
}
