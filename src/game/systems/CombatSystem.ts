/**
 * CombatSystem.ts - Combat state machine and damage calculation
 *
 * Features:
 * - State machine for combat flow (idle -> windup -> strike -> recover)
 * - Class-specific attack patterns
 * - Hit chance, damage variance, critical hits
 * - Turn-based combat with timing
 */

import type { BattleScene } from '../scenes/BattleScene';
import type { Hero } from '../entities/Hero';
import type { Enemy } from '../entities/Enemy';
import { CombatAnimState } from '../entities/Hero';

// Combat state enum
export enum CombatState {
  IDLE = 'idle',
  HERO_WINDUP = 'hero_windup',
  HERO_STRIKE = 'hero_strike',
  HERO_RECOVER = 'hero_recover',
  ENEMY_WINDUP = 'enemy_windup',
  ENEMY_STRIKE = 'enemy_strike',
  ENEMY_RECOVER = 'enemy_recover',
}

// Hero class types
export type HeroClass = 'warrior' | 'rogue' | 'mage' | 'paladin' | 'ranger';

// Enemy types
export type EnemyType = 'skeleton' | 'orc' | 'demon';

// Class combat stats
interface ClassStats {
  baseDamage: number;
  critChance: number;
  critMultiplier: number;
  attackSpeed: number; // multiplier for timing
  hitChance: number;
  windupTime: number;
  strikeTime: number;
  recoverTime: number;
}

const CLASS_STATS: Record<HeroClass, ClassStats> = {
  warrior: {
    baseDamage: 18,
    critChance: 0.1,
    critMultiplier: 2.0,
    attackSpeed: 1.0,
    hitChance: 0.85,
    windupTime: 400,
    strikeTime: 150,
    recoverTime: 300,
  },
  rogue: {
    baseDamage: 12,
    critChance: 0.25,
    critMultiplier: 2.5,
    attackSpeed: 1.5,
    hitChance: 0.9,
    windupTime: 200,
    strikeTime: 100,
    recoverTime: 200,
  },
  mage: {
    baseDamage: 22,
    critChance: 0.15,
    critMultiplier: 1.8,
    attackSpeed: 0.8,
    hitChance: 0.95,
    windupTime: 600,
    strikeTime: 200,
    recoverTime: 400,
  },
  paladin: {
    baseDamage: 15,
    critChance: 0.12,
    critMultiplier: 2.2,
    attackSpeed: 0.9,
    hitChance: 0.88,
    windupTime: 450,
    strikeTime: 180,
    recoverTime: 350,
  },
  ranger: {
    baseDamage: 14,
    critChance: 0.2,
    critMultiplier: 2.3,
    attackSpeed: 1.2,
    hitChance: 0.92,
    windupTime: 350,
    strikeTime: 120,
    recoverTime: 280,
  },
};

// Enemy stats
interface EnemyStats {
  baseDamage: number;
  critChance: number;
  hitChance: number;
  attackSpeed: number;
}

const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  skeleton: {
    baseDamage: 8,
    critChance: 0.05,
    hitChance: 0.75,
    attackSpeed: 1.1,
  },
  orc: {
    baseDamage: 15,
    critChance: 0.08,
    hitChance: 0.7,
    attackSpeed: 0.8,
  },
  demon: {
    baseDamage: 12,
    critChance: 0.15,
    hitChance: 0.85,
    attackSpeed: 1.0,
  },
};

export class CombatSystem {
  private scene: BattleScene;
  private hero: Hero;
  private enemy: Enemy;

  // State
  private state: CombatState = CombatState.IDLE;
  private stateTimer = 0;
  private turnCounter = 0;
  private isHeroTurn = true;

  // Current stats
  private heroClass: HeroClass = 'warrior';
  private enemyType: EnemyType = 'skeleton';

  // Timing
  private idleDelay = 800;
  private currentStateTime = 0;

  constructor(scene: BattleScene, hero: Hero, enemy: Enemy) {
    this.scene = scene;
    this.hero = hero;
    this.enemy = enemy;
  }

  update(time: number, delta: number): void {
    this.stateTimer += delta;

    switch (this.state) {
      case CombatState.IDLE:
        this.handleIdle();
        break;
      case CombatState.HERO_WINDUP:
        this.handleHeroWindup();
        break;
      case CombatState.HERO_STRIKE:
        this.handleHeroStrike();
        break;
      case CombatState.HERO_RECOVER:
        this.handleHeroRecover();
        break;
      case CombatState.ENEMY_WINDUP:
        this.handleEnemyWindup();
        break;
      case CombatState.ENEMY_STRIKE:
        this.handleEnemyStrike();
        break;
      case CombatState.ENEMY_RECOVER:
        this.handleEnemyRecover();
        break;
    }
  }

  private handleIdle(): void {
    if (this.stateTimer >= this.idleDelay) {
      // Start next turn
      if (this.isHeroTurn) {
        this.setState(CombatState.HERO_WINDUP);
        this.hero.setAnimState(CombatAnimState.WINDUP);
        this.currentStateTime = CLASS_STATS[this.heroClass].windupTime;
      } else {
        this.setState(CombatState.ENEMY_WINDUP);
        this.enemy.setAnimState(CombatAnimState.WINDUP);
        this.currentStateTime = 400 / ENEMY_STATS[this.enemyType].attackSpeed;
      }
    }
  }

  private handleHeroWindup(): void {
    if (this.stateTimer >= this.currentStateTime) {
      this.setState(CombatState.HERO_STRIKE);
      this.hero.setAnimState(CombatAnimState.STRIKE);
      this.currentStateTime = CLASS_STATS[this.heroClass].strikeTime;

      // Perform attack at start of strike
      this.performHeroAttack();
    }
  }

  private handleHeroStrike(): void {
    if (this.stateTimer >= this.currentStateTime) {
      this.setState(CombatState.HERO_RECOVER);
      this.hero.setAnimState(CombatAnimState.RECOVER);
      this.currentStateTime = CLASS_STATS[this.heroClass].recoverTime;
    }
  }

  private handleHeroRecover(): void {
    if (this.stateTimer >= this.currentStateTime) {
      this.hero.setAnimState(CombatAnimState.IDLE);
      this.enemy.setAnimState(CombatAnimState.IDLE);
      this.isHeroTurn = false;
      this.turnCounter++;
      this.setState(CombatState.IDLE);
    }
  }

  private handleEnemyWindup(): void {
    if (this.stateTimer >= this.currentStateTime) {
      this.setState(CombatState.ENEMY_STRIKE);
      this.enemy.setAnimState(CombatAnimState.STRIKE);
      this.currentStateTime = 150 / ENEMY_STATS[this.enemyType].attackSpeed;

      // Perform attack
      this.performEnemyAttack();
    }
  }

  private handleEnemyStrike(): void {
    if (this.stateTimer >= this.currentStateTime) {
      this.setState(CombatState.ENEMY_RECOVER);
      this.enemy.setAnimState(CombatAnimState.RECOVER);
      this.currentStateTime = 300 / ENEMY_STATS[this.enemyType].attackSpeed;
    }
  }

  private handleEnemyRecover(): void {
    if (this.stateTimer >= this.currentStateTime) {
      this.enemy.setAnimState(CombatAnimState.IDLE);
      this.hero.setAnimState(CombatAnimState.IDLE);
      this.isHeroTurn = true;
      this.turnCounter++;
      this.setState(CombatState.IDLE);
    }
  }

  private setState(newState: CombatState): void {
    this.state = newState;
    this.stateTimer = 0;
  }

  private performHeroAttack(): void {
    const stats = CLASS_STATS[this.heroClass];

    // Hit check
    if (Math.random() > stats.hitChance) {
      this.scene.addLogEntry(`⚔️ ${this.heroClass} attacks but misses!`, 'hero-action');
      this.scene.fxSystem.playMissEffect(this.enemy.x, this.enemy.y - 50);
      return;
    }

    // Calculate damage
    let damage = stats.baseDamage + Phaser.Math.Between(-3, 5);
    let isCrit = false;

    // Critical hit check
    if (Math.random() < stats.critChance) {
      damage = Math.floor(damage * stats.critMultiplier);
      isCrit = true;
    }

    // Apply damage
    this.enemy.takeDamage(damage);
    this.enemy.setAnimState(CombatAnimState.HIT);

    // Visual effects based on class
    this.playHeroAttackEffects(damage, isCrit);

    // Hit stop (micro-freeze)
    this.scene.time.delayedCall(80, () => {
      this.enemy.setAnimState(CombatAnimState.IDLE);
    });

    // Log
    if (isCrit) {
      this.scene.addLogEntry(`💥 CRITICAL! ${this.heroClass} deals ${damage} damage!`, 'critical');
    } else {
      this.scene.addLogEntry(`⚔️ ${this.heroClass} hits for ${damage} damage`, 'hero-action');
    }

    console.log(`[Combat] Hero attacks: ${damage} damage (crit: ${isCrit}), Enemy HP: ${this.enemy.currentHP}`);
  }

  private performEnemyAttack(): void {
    const stats = ENEMY_STATS[this.enemyType];

    // Hit check
    if (Math.random() > stats.hitChance) {
      this.scene.addLogEntry(`💀 ${this.enemyType} swings and misses!`, 'enemy-action');
      this.scene.fxSystem.playMissEffect(this.hero.x, this.hero.y - 50);
      return;
    }

    // Calculate damage
    let damage = stats.baseDamage + Phaser.Math.Between(-2, 4);
    let isCrit = false;

    if (Math.random() < stats.critChance) {
      damage = Math.floor(damage * 2);
      isCrit = true;
    }

    // Apply damage
    this.hero.takeDamage(damage);
    this.hero.setAnimState(CombatAnimState.HIT);

    // Visual effects
    this.scene.fxSystem.playHitEffect(this.hero.x, this.hero.y - 50, damage, isCrit);
    this.scene.fxSystem.screenShake(isCrit ? 8 : 4);

    // Hit stop
    this.scene.time.delayedCall(80, () => {
      this.hero.setAnimState(CombatAnimState.IDLE);
    });

    // Log
    if (isCrit) {
      this.scene.addLogEntry(`💀 CRITICAL! ${this.enemyType} deals ${damage} damage!`, 'critical');
    } else {
      this.scene.addLogEntry(`💀 ${this.enemyType} hits for ${damage} damage`, 'enemy-action');
    }

    console.log(`[Combat] Enemy attacks: ${damage} damage (crit: ${isCrit}), Hero HP: ${this.hero.currentHP}`);
  }

  private playHeroAttackEffects(damage: number, isCrit: boolean): void {
    const fx = this.scene.fxSystem;
    const targetX = this.enemy.x;
    const targetY = this.enemy.y - 50;

    // Base hit effect
    fx.playHitEffect(targetX, targetY, damage, isCrit);

    // Class-specific effects
    switch (this.heroClass) {
      case 'warrior':
        fx.playSlashEffect(targetX, targetY);
        fx.playDustEffect(this.hero.x + 30, this.hero.y);
        fx.screenShake(isCrit ? 10 : 6);
        break;

      case 'rogue':
        fx.playDashEffect(this.hero.x, this.hero.y - 50, targetX, targetY);
        // Double hit for rogue
        this.scene.time.delayedCall(100, () => {
          fx.playHitEffect(targetX + 10, targetY - 10, Math.floor(damage * 0.5), false);
        });
        fx.screenShake(isCrit ? 6 : 3);
        break;

      case 'mage':
        fx.playMagicOrbEffect(this.hero.x + 40, this.hero.y - 60, targetX, targetY);
        fx.playRuneCircleEffect(targetX, targetY + 50);
        fx.screenShake(isCrit ? 8 : 4);
        break;

      case 'paladin':
        fx.playSmiteEffect(targetX, targetY - 30);
        fx.playHolyGlowEffect(this.hero.x, this.hero.y - 60);
        fx.screenShake(isCrit ? 12 : 7);
        break;

      case 'ranger':
        fx.playArrowEffect(this.hero.x + 30, this.hero.y - 50, targetX, targetY);
        fx.screenShake(isCrit ? 5 : 2);
        break;
    }
  }

  // Public methods

  public setHeroClass(heroClass: HeroClass): void {
    this.heroClass = heroClass;
  }

  public setEnemyType(enemyType: EnemyType): void {
    this.enemyType = enemyType;
  }

  public reset(): void {
    this.state = CombatState.IDLE;
    this.stateTimer = 0;
    this.turnCounter = 0;
    this.isHeroTurn = true;
    this.hero.setAnimState(CombatAnimState.IDLE);
    this.enemy.setAnimState(CombatAnimState.IDLE);
  }

  public getState(): CombatState {
    return this.state;
  }

  public getTurnCount(): number {
    return this.turnCounter;
  }
}
