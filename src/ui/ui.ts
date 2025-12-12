/**
 * ui.ts - DOM UI bindings and interactions
 *
 * Connects HTML UI elements to game state and controls
 */

import Phaser from 'phaser';
import type { BattleScene } from '../game/scenes/BattleScene';
import type { HeroClass, EnemyType } from '../game/systems/CombatSystem';
import { avatarSystem } from '../game/systems/AvatarSystem';

// Simple game store interface
export interface GameStore {
  heroClass: HeroClass;
  heroGender: 'masculine' | 'feminine';
  heroGlamour: number;
  enemyType: EnemyType;
  isPaused: boolean;
  isGameOver: boolean;
}

// Global store
const store: GameStore = {
  heroClass: 'warrior',
  heroGender: 'masculine',
  heroGlamour: 50,
  enemyType: 'skeleton',
  isPaused: true,
  isGameOver: false,
};

// Get battle scene reference
function getBattleScene(game: Phaser.Game): BattleScene | null {
  return game.scene.getScene('BattleScene') as BattleScene | null;
}

/**
 * Initialize all UI bindings
 */
export function initUI(game: Phaser.Game): void {
  // Wait for scene to be ready
  game.events.once('ready', () => {
    setupClassSelector(game);
    setupGenderSelector(game);
    setupGlamourSlider(game);
    setupEnemySelector(game);
    setupControlButtons(game);
    setupKeyboardShortcuts(game);
    setupResultModal(game);
    loadInitialAvatars();
  });

  // Also try immediately in case scene is already ready
  setTimeout(() => {
    const scene = getBattleScene(game);
    if (scene) {
      setupClassSelector(game);
      setupGenderSelector(game);
      setupGlamourSlider(game);
      setupEnemySelector(game);
      setupControlButtons(game);
      setupKeyboardShortcuts(game);
      setupResultModal(game);
      loadInitialAvatars();
    }
  }, 500);

  console.log('🎮 UI initialized');
}

/**
 * Class selection buttons
 */
function setupClassSelector(game: Phaser.Game): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('#class-selector .class-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const heroClass = btn.dataset.class as HeroClass;
      if (!heroClass) return;

      // Update UI
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update store
      store.heroClass = heroClass;

      // Update game
      const scene = getBattleScene(game);
      if (scene) {
        scene.setHeroClass(heroClass);
        scene.resetBattle();
      }

      // Update avatar
      updateHeroAvatar();

      console.log(`Class changed to: ${heroClass}`);
    });
  });
}

/**
 * Gender selection buttons
 */
function setupGenderSelector(game: Phaser.Game): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('#gender-selector .gender-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gender = btn.dataset.gender as 'masculine' | 'feminine';
      if (!gender) return;

      // Update UI
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update store
      store.heroGender = gender;

      // Update game
      const scene = getBattleScene(game);
      if (scene) {
        scene.setHeroGender(gender);
      }

      // Update avatar
      updateHeroAvatar();

      console.log(`Gender changed to: ${gender}`);
    });
  });
}

/**
 * Glamour slider
 */
function setupGlamourSlider(game: Phaser.Game): void {
  const slider = document.getElementById('glamour-slider') as HTMLInputElement;
  const valueDisplay = document.getElementById('glamour-value');

  if (!slider) return;

  slider.addEventListener('input', () => {
    const glamour = parseInt(slider.value, 10);

    // Update display
    if (valueDisplay) {
      valueDisplay.textContent = glamour.toString();
    }

    // Update store
    store.heroGlamour = glamour;

    // Update game
    const scene = getBattleScene(game);
    if (scene) {
      scene.setHeroGlamour(glamour);
    }
  });

  // Debounced avatar update on change end
  slider.addEventListener('change', () => {
    updateHeroAvatar();
    console.log(`Glamour changed to: ${store.heroGlamour}`);
  });
}

/**
 * Enemy type selector
 */
function setupEnemySelector(game: Phaser.Game): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('#enemy-selector .enemy-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const enemyType = btn.dataset.enemy as EnemyType;
      if (!enemyType) return;

      // Update UI
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update store
      store.enemyType = enemyType;

      // Update game
      const scene = getBattleScene(game);
      if (scene) {
        scene.setEnemyType(enemyType);
        scene.resetBattle();
      }

      // Update avatar
      updateEnemyAvatar();

      console.log(`Enemy type changed to: ${enemyType}`);
    });
  });
}

/**
 * Fight/Reset buttons
 */
function setupControlButtons(game: Phaser.Game): void {
  const fightBtn = document.getElementById('fight-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (fightBtn) {
    fightBtn.addEventListener('click', () => {
      const scene = getBattleScene(game);
      if (scene && !scene.getIsGameOver()) {
        scene.togglePause();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const scene = getBattleScene(game);
      if (scene) {
        scene.resetBattle();
      }
    });
  }
}

/**
 * Keyboard shortcuts
 */
function setupKeyboardShortcuts(game: Phaser.Game): void {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const scene = getBattleScene(game);
    if (!scene) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (!scene.getIsGameOver()) {
          scene.togglePause();
        }
        break;

      case 'KeyR':
        scene.resetBattle();
        break;

      case 'Digit1':
      case 'Numpad1':
        selectClass('warrior', game);
        break;

      case 'Digit2':
      case 'Numpad2':
        selectClass('rogue', game);
        break;

      case 'Digit3':
      case 'Numpad3':
        selectClass('mage', game);
        break;

      case 'Digit4':
      case 'Numpad4':
        selectClass('paladin', game);
        break;

      case 'Digit5':
      case 'Numpad5':
        selectClass('ranger', game);
        break;
    }
  });
}

/**
 * Select class programmatically
 */
function selectClass(heroClass: HeroClass, game: Phaser.Game): void {
  const btn = document.querySelector<HTMLButtonElement>(`#class-selector [data-class="${heroClass}"]`);
  if (btn) {
    btn.click();
  }
}

/**
 * Result modal setup
 */
function setupResultModal(game: Phaser.Game): void {
  const continueBtn = document.getElementById('continue-btn');

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const modal = document.getElementById('result-modal');
      if (modal) {
        modal.classList.add('hidden');
      }

      const scene = getBattleScene(game);
      if (scene) {
        scene.resetBattle();
      }
    });
  }
}

/**
 * Update hero avatar from API
 */
async function updateHeroAvatar(): Promise<void> {
  const avatarImg = document.getElementById('hero-avatar') as HTMLImageElement;
  const loading = document.querySelector('#hero-portrait .portrait-loading') as HTMLElement;

  if (!avatarImg) return;

  // Show loading
  if (loading) {
    loading.style.display = 'block';
  }
  avatarImg.style.opacity = '0.3';

  try {
    const url = await avatarSystem.getHeroAvatar({
      heroClass: store.heroClass,
      gender: store.heroGender,
      glamour: store.heroGlamour,
    });

    avatarImg.src = url;
    avatarImg.onload = () => {
      avatarImg.style.opacity = '1';
      if (loading) {
        loading.style.display = 'none';
      }
    };
    avatarImg.onerror = () => {
      // Fallback to placeholder
      avatarImg.src = generateFallbackAvatar('hero');
      avatarImg.style.opacity = '1';
      if (loading) {
        loading.style.display = 'none';
      }
    };
  } catch (error) {
    console.error('Failed to load hero avatar:', error);
    avatarImg.src = generateFallbackAvatar('hero');
    avatarImg.style.opacity = '1';
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

/**
 * Update enemy avatar from API
 */
async function updateEnemyAvatar(): Promise<void> {
  const avatarImg = document.getElementById('enemy-avatar') as HTMLImageElement;

  if (!avatarImg) return;

  try {
    const url = await avatarSystem.getEnemyAvatar({
      type: store.enemyType,
    });

    avatarImg.src = url;
    avatarImg.onerror = () => {
      avatarImg.src = generateFallbackAvatar('enemy');
    };
  } catch (error) {
    console.error('Failed to load enemy avatar:', error);
    avatarImg.src = generateFallbackAvatar('enemy');
  }
}

/**
 * Generate simple SVG fallback avatar
 */
function generateFallbackAvatar(type: 'hero' | 'enemy'): string {
  const color = type === 'hero' ? '#d4a84b' : '#8b2942';
  const bgColor = type === 'hero' ? '#2d2a32' : '#1a181d';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}"/>
      <circle cx="50" cy="40" r="20" fill="${color}"/>
      <rect x="30" y="60" width="40" height="30" rx="5" fill="${color}"/>
      <text x="50" y="95" font-size="12" fill="${color}" text-anchor="middle">
        ${type === 'hero' ? '⚔️' : '💀'}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Load initial avatars on startup
 */
function loadInitialAvatars(): void {
  updateHeroAvatar();
  updateEnemyAvatar();
}

// Export store for debugging
export { store };
