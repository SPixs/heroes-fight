/**
 * BootScene.ts - Initial loading scene
 *
 * Handles preloading and initialization before battle
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      color: '#d4a84b',
    });
    loadingText.setOrigin(0.5);

    // Progress bar background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x2d2a32, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    // Progress bar
    const progressBar = this.add.graphics();

    // Loading events
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xd4a84b, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate procedural textures
    this.createProceduralTextures();
  }

  create(): void {
    // Transition to battle scene
    this.scene.start('BattleScene');
  }

  private createProceduralTextures(): void {
    // Create particle texture
    const particleGraphics = this.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillCircle(8, 8, 8);
    particleGraphics.generateTexture('particle', 16, 16);
    particleGraphics.destroy();

    // Create spark texture
    const sparkGraphics = this.make.graphics({ x: 0, y: 0 });
    sparkGraphics.fillStyle(0xffffff, 1);
    sparkGraphics.fillRect(0, 3, 12, 2);
    sparkGraphics.fillRect(5, 0, 2, 8);
    sparkGraphics.generateTexture('spark', 12, 8);
    sparkGraphics.destroy();

    // Create slash arc texture
    const slashGraphics = this.make.graphics({ x: 0, y: 0 });
    slashGraphics.lineStyle(4, 0xffffff, 1);
    slashGraphics.beginPath();
    slashGraphics.arc(40, 40, 35, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
    slashGraphics.strokePath();
    slashGraphics.generateTexture('slash-arc', 80, 80);
    slashGraphics.destroy();

    // Create arrow texture
    const arrowGraphics = this.make.graphics({ x: 0, y: 0 });
    arrowGraphics.fillStyle(0x8b4513, 1);
    arrowGraphics.fillRect(0, 3, 30, 2);
    arrowGraphics.fillStyle(0x808080, 1);
    arrowGraphics.fillTriangle(30, 0, 40, 4, 30, 8);
    arrowGraphics.fillStyle(0x654321, 1);
    arrowGraphics.fillTriangle(0, 0, 8, 4, 0, 8);
    arrowGraphics.generateTexture('arrow', 40, 8);
    arrowGraphics.destroy();

    // Create magic orb texture
    const orbGraphics = this.make.graphics({ x: 0, y: 0 });
    orbGraphics.fillGradientStyle(0x9b6dcc, 0x9b6dcc, 0x4a2870, 0x4a2870, 1);
    orbGraphics.fillCircle(16, 16, 14);
    orbGraphics.fillStyle(0xffffff, 0.5);
    orbGraphics.fillCircle(12, 10, 4);
    orbGraphics.generateTexture('magic-orb', 32, 32);
    orbGraphics.destroy();

    // Create holy smite texture
    const smiteGraphics = this.make.graphics({ x: 0, y: 0 });
    smiteGraphics.fillStyle(0xf5e642, 0.8);
    smiteGraphics.fillTriangle(20, 0, 0, 60, 40, 60);
    smiteGraphics.fillStyle(0xffffff, 0.6);
    smiteGraphics.fillTriangle(20, 10, 8, 55, 32, 55);
    smiteGraphics.generateTexture('smite', 40, 60);
    smiteGraphics.destroy();

    // Create rune circle texture
    const runeGraphics = this.make.graphics({ x: 0, y: 0 });
    runeGraphics.lineStyle(2, 0x9b6dcc, 0.8);
    runeGraphics.strokeCircle(40, 40, 35);
    runeGraphics.strokeCircle(40, 40, 25);
    // Add some rune-like marks
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = 40 + Math.cos(angle) * 25;
      const y1 = 40 + Math.sin(angle) * 25;
      const x2 = 40 + Math.cos(angle) * 35;
      const y2 = 40 + Math.sin(angle) * 35;
      runeGraphics.lineBetween(x1, y1, x2, y2);
    }
    runeGraphics.generateTexture('rune-circle', 80, 80);
    runeGraphics.destroy();
  }
}
