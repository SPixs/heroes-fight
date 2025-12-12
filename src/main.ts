/**
 * Dungeon Heroes Fight - Main Entry Point
 *
 * Initializes the Phaser game and connects UI components
 */

import { initGame } from './game/Game';
import { initUI } from './ui/ui';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Dungeon Heroes Fight - Initializing...');

  // Initialize the Phaser game
  const game = initGame();

  // Initialize UI bindings
  initUI(game);

  // Self-check: verify game is running
  setTimeout(() => {
    if (game.isRunning) {
      console.log('✅ Game initialized successfully');
    } else {
      console.error('❌ Game failed to initialize');
    }
  }, 1000);
});

// Handle window resize
window.addEventListener('resize', () => {
  // Phaser handles canvas resize via scale manager
});
