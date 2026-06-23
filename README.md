# Sheep Count Game

A top-down sheep counting game built with Expo (React Native).

## Tech stack

| Package | Purpose |
|---|---|
| `expo ~52` + `expo-router ~4` | Navigation & build tooling |
| `react-native-svg ~15.8` | SVG-based game rendering (viewBox coordinate system) |
| `react-native-safe-area-context` | Safe area insets for notched devices |
| `react-native-screens ~4.4` | Native screen containers used by expo-router |
| `@react-native-async-storage/async-storage` | Persisting top score & session history on device |
| `zustand ^5` | In-memory session state (streak, correct/wrong counts) |

## Project structure

```
SheepCountGame/
├── app/
│   ├── _layout.jsx        # Root expo-router layout (Stack, StatusBar)
│   ├── index.jsx          # Menu screen (play / view history / top score)
│   ├── game.jsx           # Game screen (session timer, HUD, choice box, entry counter)
│   └── history.jsx        # History screen (past sessions list)
│
├── components/
│   ├── GameCanvas.jsx     # SVG canvas + requestAnimationFrame game loop
│   └── ChoiceButtons.jsx  # Three answer option buttons
│
├── constants/
│   └── game.js            # TILE, COLS, TOTAL_ROWS, corral config — derived from screen size
│
├── hooks/
│   └── useTopScore.js     # Load/save top score from AsyncStorage
│
├── store/
│   └── sessionStore.js    # Zustand store: streak + correct/wrong counters
│
├── utils/
│   ├── format.js          # formatTime(), formatDuration()
│   ├── sheep.js           # randomSheepCount() → 3–9, buildOptions()
│   ├── sheepFactory.js    # buildSheep() — corral slots (3×3) + field targets
│   ├── storage.js         # AsyncStorage helpers (top score + session history)
│   └── trees.js           # buildTrees() — random tree positions per round
│
├── assets/
├── app.json
├── babel.config.js
├── jsconfig.json          # Path alias @/ for Expo's babel transform
└── package.json
```

## Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run on iOS simulator
npm run ios

# 3. Run on Android
npm run android
```

## Game flow

```
Menu ──► Game (5 min session)
              │
              ├─ sheep exit corral one by one → spread across field (releasing)
              ├─ sheep stop in field → 3 answer options appear (answering)
              ├─ user picks → sheep return to corral one by one (returning)
              │     └─ large number bounces on screen counting each sheep entering
              └─ repeat until timer runs out or user ends session
                    └─ saves session record → back to Menu
```

## Rendering

The game renders using `react-native-svg` with a fixed internal coordinate system (`viewBox`):

- **Internal grid:** `COLS × TOTAL_ROWS` tiles, each tile `20×20 px` in viewBox space
- **Display size:** `CANVAS_W = SCREEN_W − 64`, `CANVAS_H = SCREEN_H − 64` (32 px padding on all sides)
- **Scale:** computed automatically by the SVG `viewBox`; all game logic uses tile coordinates
- `TOTAL_ROWS` is calculated at startup from the device screen height so the canvas fills the available area on any device

## Layout zones

| Zone | Rows | Purpose |
|---|---|---|
| HUD | 0–3 | Timer, streak counter, end-session button (absolute overlay) |
| Field | 4 – `CORRAL_Y − 3` | Sheep graze here; trees appear here |
| Corral | `CORRAL_Y` – `TOTAL_ROWS − 10` | 9×8 tile pen; 3×3 slot grid |
| Choice box buffer | last ~9 rows | Kept clear so the answer buttons don't cover the corral |

## Sheep

- **Scale:** `SHEEP_SCALE = 2.5` applied to each sheep's SVG group (~2.25 tiles wide visually)
- **Corral slots:** 3 columns × 3 rows, `SLOT_SPACING = 2.5` tiles (≥ sheep width, no overlap)
- **Field targets:** minimum 3.0 tile separation between sheep centers
- **Separation force:** applied during `walkingout` and `toField` states to prevent sheep passing through each other in motion
- **Count range:** 3–9 sheep per round (matches the 3×3 corral capacity)

## Constants (`constants/game.js`)

All layout values are exported from a single file. `CORRAL_Y` and `TOTAL_ROWS` depend on the runtime screen dimensions so you rarely need to change them manually.

| Constant | Value | Description |
|---|---|---|
| `TILE` | 20 | Pixels per tile in viewBox space |
| `COLS` | 19 | Grid columns (BASE_W = 380 px) |
| `TOTAL_ROWS` | ~46 on iPhone 14 | Computed from screen height |
| `BASE_H` | `TOTAL_ROWS × TILE` | viewBox height |
| `SAFE_TOP_ROWS` | 4 | Rows reserved for HUD |
| `CORRAL_X / Y` | 1 / dynamic | Corral top-left corner (tile coords) |
| `CORRAL_W / H` | 9 / 8 | Corral size in tiles |
| `SESSION_SECONDS` | 300 | Session duration (5 min) |
| `ENTRY_STAGGER_FRAMES` | 22 | Frames between each sheep entering on return |
