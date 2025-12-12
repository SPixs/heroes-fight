/**
 * Game.ts - Phaser Game Configuration and Initialization
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { BattleScene } from './scenes/BattleScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a181d',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, BattleScene],
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};

// Initialize and export the game instance
export function initGame(): Phaser.Game {
  const game = new Phaser.Game(config);

  // Store reference globally for UI access
  (window as unknown as { game: Phaser.Game }).game = game;

  return game;
}

// Get the current battle scene
export function getBattleScene(): BattleScene | null {
  const game = (window as unknown as { game: Phaser.Game }).game;
  if (!game) return null;
  return game.scene.getScene('BattleScene') as BattleScene;
}
