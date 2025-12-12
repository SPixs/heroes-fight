/**
 * AvatarSystem.ts - Avatar generation and caching
 *
 * Features:
 * - DiceBear API integration (free, no API key)
 * - LocalStorage caching
 * - Fallback to procedural avatars
 * - Optional Replicate/HuggingFace integration (requires API key)
 */

import type { HeroClass, EnemyType } from './CombatSystem';

// Avatar configuration
interface AvatarConfig {
  heroClass: HeroClass;
  gender: 'masculine' | 'feminine';
  glamour: number;
}

interface EnemyAvatarConfig {
  type: EnemyType;
}

// DiceBear style mapping
const DICEBEAR_STYLES: Record<HeroClass, string> = {
  warrior: 'adventurer',
  rogue: 'adventurer',
  mage: 'adventurer',
  paladin: 'adventurer',
  ranger: 'adventurer',
};

// Seed generation for consistent avatars
function generateSeed(config: AvatarConfig): string {
  return `${config.heroClass}-${config.gender}-${Math.floor(config.glamour / 20)}`;
}

function generateEnemySeed(config: EnemyAvatarConfig): string {
  return `enemy-${config.type}`;
}

// Cache key generation
function getCacheKey(type: 'hero' | 'enemy', seed: string): string {
  return `dungeon-heroes-avatar-${type}-${seed}`;
}

export class AvatarSystem {
  private static instance: AvatarSystem;

  // Current configuration
  private heroConfig: AvatarConfig = {
    heroClass: 'warrior',
    gender: 'masculine',
    glamour: 50,
  };

  private enemyConfig: EnemyAvatarConfig = {
    type: 'skeleton',
  };

  // API configuration (optional)
  private replicateApiUrl: string | null = null;
  private huggingfaceApiUrl: string | null = null;

  private constructor() {
    // Check for optional API endpoints
    this.replicateApiUrl = import.meta.env.VITE_REPLICATE_PROXY_URL || null;
    this.huggingfaceApiUrl = import.meta.env.VITE_HUGGINGFACE_PROXY_URL || null;
  }

  public static getInstance(): AvatarSystem {
    if (!AvatarSystem.instance) {
      AvatarSystem.instance = new AvatarSystem();
    }
    return AvatarSystem.instance;
  }

  /**
   * Get hero avatar URL (DiceBear or cached)
   */
  async getHeroAvatar(config: AvatarConfig): Promise<string> {
    this.heroConfig = config;
    const seed = generateSeed(config);
    const cacheKey = getCacheKey('hero', seed);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Try AI-generated avatar if API is configured
    if (this.replicateApiUrl || this.huggingfaceApiUrl) {
      try {
        const aiAvatar = await this.generateAIAvatar(config);
        if (aiAvatar) {
          this.saveToCache(cacheKey, aiAvatar);
          return aiAvatar;
        }
      } catch (error) {
        console.warn('AI avatar generation failed, falling back to DiceBear:', error);
      }
    }

    // Generate DiceBear avatar
    const diceBearUrl = this.generateDiceBearUrl(config);
    this.saveToCache(cacheKey, diceBearUrl);
    return diceBearUrl;
  }

  /**
   * Get enemy avatar URL
   */
  async getEnemyAvatar(config: EnemyAvatarConfig): Promise<string> {
    this.enemyConfig = config;
    const seed = generateEnemySeed(config);
    const cacheKey = getCacheKey('enemy', seed);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate DiceBear avatar for enemy
    const url = this.generateEnemyDiceBearUrl(config);
    this.saveToCache(cacheKey, url);
    return url;
  }

  /**
   * Generate DiceBear URL for hero
   */
  private generateDiceBearUrl(config: AvatarConfig): string {
    const style = DICEBEAR_STYLES[config.heroClass];
    const seed = generateSeed(config);

    // Build options based on class and gender
    const options: Record<string, string> = {
      seed,
      backgroundColor: this.getClassBackgroundColor(config.heroClass),
    };

    // Gender-based features
    if (config.gender === 'feminine') {
      options.hair = 'long01,long02,long03,long04,long05';
      options.earrings = 'variant01,variant02';
    } else {
      options.hair = 'short01,short02,short03,short04';
      options.facialHair = 'variant01,variant02,variant03';
    }

    // Glamour affects accessories and details
    if (config.glamour > 70) {
      options.glassesProbability = '0';
    }

    // Build URL
    const params = new URLSearchParams(options);
    return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
  }

  /**
   * Generate DiceBear URL for enemy
   */
  private generateEnemyDiceBearUrl(config: EnemyAvatarConfig): string {
    const seed = generateEnemySeed(config);

    // Use bottts or shapes style for enemies
    const style = config.type === 'demon' ? 'bottts' : 'shapes';

    const colors: Record<EnemyType, string> = {
      skeleton: 'e8e8e8,c0c0c0',
      orc: '4a5a2a,3a4a1a',
      demon: '8b0000,4a0000',
    };

    const params = new URLSearchParams({
      seed,
      backgroundColor: colors[config.type].split(',')[0],
    });

    return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
  }

  /**
   * Get class-specific background color
   */
  private getClassBackgroundColor(heroClass: HeroClass): string {
    const colors: Record<HeroClass, string> = {
      warrior: '8b4513',
      rogue: '2f2f2f',
      mage: '4a2870',
      paladin: 'daa520',
      ranger: '228b22',
    };
    return colors[heroClass];
  }

  /**
   * Generate AI avatar using Replicate or HuggingFace
   * (Requires proxy server to protect API keys)
   */
  private async generateAIAvatar(config: AvatarConfig): Promise<string | null> {
    const prompt = this.buildAIPrompt(config);

    // Try Replicate first
    if (this.replicateApiUrl) {
      try {
        const response = await fetch(this.replicateApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            style: 'fantasy_portrait',
            negative_prompt: 'nsfw, nude, explicit, violent, gore, blood',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            return data.imageUrl;
          }
        }
      } catch (error) {
        console.warn('Replicate API error:', error);
      }
    }

    // Try HuggingFace
    if (this.huggingfaceApiUrl) {
      try {
        const response = await fetch(this.huggingfaceApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } catch (error) {
        console.warn('HuggingFace API error:', error);
      }
    }

    return null;
  }

  /**
   * Build AI prompt for avatar generation (PG-13)
   */
  private buildAIPrompt(config: AvatarConfig): string {
    const classDescriptions: Record<HeroClass, string> = {
      warrior: 'armored warrior with sword and shield, battle-hardened',
      rogue: 'mysterious rogue with daggers, hooded, stealthy',
      mage: 'mystical mage with glowing staff, robes, magical aura',
      paladin: 'noble paladin in shining armor, holy light, righteous',
      ranger: 'skilled ranger with bow, forest green attire, nature themed',
    };

    const genderStyle = config.gender === 'feminine' ? 'female' : 'male';
    const glamourDesc = config.glamour > 70
      ? 'heroic, elegant, majestic'
      : config.glamour > 40
        ? 'adventurer, capable, determined'
        : 'humble, practical, grounded';

    return `Fantasy portrait of a ${genderStyle} ${classDescriptions[config.heroClass]}, ${glamourDesc} appearance, medieval fantasy style, professional illustration, detailed, safe for work, no nudity`;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): string | null {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        // Check expiry (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.url;
        }
        localStorage.removeItem(key);
      }
    } catch {
      // Cache error, ignore
    }
    return null;
  }

  private saveToCache(key: string, url: string): void {
    try {
      localStorage.setItem(key, JSON.stringify({
        url,
        timestamp: Date.now(),
      }));
    } catch {
      // Cache full or disabled, ignore
    }
  }

  /**
   * Clear all cached avatars
   */
  public clearCache(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dungeon-heroes-avatar-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} cached avatars`);
  }

  /**
   * Preload avatars for current configuration
   */
  async preloadAvatars(): Promise<void> {
    await Promise.all([
      this.getHeroAvatar(this.heroConfig),
      this.getEnemyAvatar(this.enemyConfig),
    ]);
  }
}

// Export singleton instance
export const avatarSystem = AvatarSystem.getInstance();
