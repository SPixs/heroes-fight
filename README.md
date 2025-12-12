# ⚔️ Dungeon Heroes Fight

A fantasy dungeon combat web game featuring animated battles between heroes and enemies. Built as a Single Page Application (SPA) with Phaser 3 and TypeScript.

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ⚔️  D U N G E O N   H E R O E S   F I G H T  ⚔️             ║
║                                                                  ║
║        🛡️ Warrior  🗡️ Rogue  🔮 Mage  ✨ Paladin  🏹 Ranger     ║
║                           VS                                     ║
║              💀 Skeleton   👹 Orc   😈 Demon                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

> **Run `npm run dev` to see the game in action!**

## ✨ Features

- **Animated Combat**: Realistic combat animations with anticipation, hit stop, screen shake, and particle effects
- **5 Hero Classes**: Warrior, Rogue, Mage, Paladin, Ranger - each with unique attack animations
- **3 Enemy Types**: Skeleton, Orc, Demon - procedurally rendered
- **Character Customization**: Gender selection and glamour slider
- **Fantasy UI**: Gold/purple themed panels with rune decorations
- **Avatar System**: DiceBear integration with optional AI generation
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

```
/dungeon-heroes-fight
├── src/
│   ├── game/
│   │   ├── Game.ts              # Phaser game configuration
│   │   ├── scenes/
│   │   │   ├── BootScene.ts     # Loading and texture generation
│   │   │   └── BattleScene.ts   # Main battle scene
│   │   ├── entities/
│   │   │   ├── Hero.ts          # Procedural hero rendering
│   │   │   └── Enemy.ts         # Procedural enemy rendering
│   │   └── systems/
│   │       ├── CombatSystem.ts  # Combat state machine
│   │       ├── FXSystem.ts      # Visual effects
│   │       └── AvatarSystem.ts  # Portrait generation
│   ├── ui/
│   │   ├── ui.ts                # DOM bindings
│   │   └── theme.css            # Fantasy styling
│   ├── main.ts                  # Entry point
│   └── index.css                # Base styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Tech Stack

- **Bundler**: Vite 5 + TypeScript
- **Game Engine**: Phaser 3 (canvas rendering, tweens, particles)
- **UI**: HTML/CSS overlay on canvas
- **Avatars**: DiceBear API (free, no key required)
- **State**: Simple store pattern

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will open at `http://localhost:3000`

## 🎮 Controls

| Action | Control |
|--------|---------|
| Start/Pause | `Space` or FIGHT button |
| Reset Battle | `R` or RESET button |
| Select Warrior | `1` |
| Select Rogue | `2` |
| Select Mage | `3` |
| Select Paladin | `4` |
| Select Ranger | `5` |

## ⚔️ Combat System

### Combat Flow
1. **Idle** → Short delay between turns
2. **Windup** → Anticipation animation (class-specific timing)
3. **Strike** → Attack execution with hit detection
4. **Recover** → Follow-through animation
5. Return to Idle, switch turns

### Class Stats

| Class | Damage | Crit% | Speed | Special |
|-------|--------|-------|-------|---------|
| Warrior | 18 | 10% | Normal | Heavy slash + dust |
| Rogue | 12 | 25% | Fast | Dash + double hit |
| Mage | 22 | 15% | Slow | Projectile + rune circle |
| Paladin | 15 | 12% | Normal | Holy smite + light |
| Ranger | 14 | 20% | Fast | Arrow shot |

### Visual Effects
- **Hit Stop**: 80ms micro-freeze on impact
- **Screen Shake**: Intensity based on damage
- **Particles**: Sparks, dust, magic effects
- **Damage Numbers**: Floating combat text
- **Class Effects**: Unique VFX per class

## 🎨 Customization

### Hero Forge Panel
- **Class**: Choose from 5 fantasy classes
- **Style**: Masculine or Feminine appearance
- **Glamour**: 0-100 slider affecting heroic appearance

### Enemy Selection
- **Skeleton**: Low HP, faster attacks
- **Orc**: High HP, slow but powerful
- **Demon**: Balanced with fire effects

## 🖼️ Avatar System

### Default: DiceBear (Free, No API Key)
Avatars are generated using [DiceBear](https://www.dicebear.com/) API:
- SVG-based, lightweight
- Cached in localStorage (24h)
- Automatic fallback if offline

### Optional: AI-Generated Portraits

#### Replicate Integration
```bash
# Set environment variable
VITE_REPLICATE_PROXY_URL=https://your-proxy.com/api/replicate
```

#### HuggingFace Integration
```bash
# Set environment variable
VITE_HUGGINGFACE_PROXY_URL=https://your-proxy.com/api/huggingface
```

**Important**: AI APIs require a proxy server to protect API keys. Example Cloudflare Worker:

```javascript
// workers/avatar-proxy.js
export default {
  async fetch(request, env) {
    const { prompt } = await request.json();

    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'stability-ai/stable-diffusion...',
        input: { prompt }
      })
    });

    return new Response(JSON.stringify(await response.json()));
  }
}
```

## 🚢 Deployment

### Netlify
```bash
npm run build
# Upload 'dist' folder or connect repo
```

### Vercel
```bash
npm run build
# Deploy with Vercel CLI or connect repo
```

### GitHub Pages
```bash
npm run build
# Push 'dist' contents to gh-pages branch
```

## 🔧 Configuration

### Environment Variables (optional)
```env
# .env.local
VITE_REPLICATE_PROXY_URL=https://...
VITE_HUGGINGFACE_PROXY_URL=https://...
```

### Vite Config
Edit `vite.config.ts` to customize:
- Base URL for deployment
- Build output directory
- Development server port

## 📝 Development Notes

### Adding New Classes
1. Add class key to `HeroClass` type in `CombatSystem.ts`
2. Add stats to `CLASS_STATS` object
3. Add colors to `CLASS_COLORS` in `Hero.ts`
4. Implement weapon drawing in `drawWeapon()`
5. Add attack effects in `playHeroAttackEffects()`
6. Add UI button in `index.html`

### Adding New Enemies
1. Add type to `EnemyType` in `CombatSystem.ts`
2. Add config to `ENEMY_CONFIG` in `Enemy.ts`
3. Implement drawing method (e.g., `drawNewEnemy()`)
4. Add stats to `ENEMY_STATS`
5. Add UI button in `index.html`

### Procedural Character Rendering
Characters are drawn using Phaser Graphics API:
- Multi-part body (head, torso, arms, legs)
- Real-time animation offsets
- Class-specific armor/weapons
- No external sprite assets required

## 🎵 Audio (Future)

Audio is prepared for Howler.js integration:
```typescript
// Example implementation
import { Howl } from 'howler';

const sounds = {
  hit: new Howl({ src: ['sounds/hit.mp3'] }),
  slash: new Howl({ src: ['sounds/slash.mp3'] }),
};
```

For now, consider procedural audio using Web Audio API oscillators.

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Credits

- **Phaser 3**: https://phaser.io/
- **DiceBear**: https://www.dicebear.com/
- **Google Fonts**: Cinzel, Crimson Text
- **Inspiration**: Classic dungeon crawlers and fantasy RPGs

---

Made with ⚔️ and TypeScript
