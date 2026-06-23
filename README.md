# Sheep Count Game 🐑

A top-down sheep counting game built with Expo (React Native).

## Tech stack

| Package | Purpose |
|---|---|
| `expo ~52` + `expo-router ~4` | Navigation & build tooling |
| `@react-native-async-storage/async-storage` | Persisting top score & session history on device |
| `zustand` | In-memory session state (streak, correct/wrong counts) |
| `@benjeau/react-native-canvas` | Canvas 2D rendering (same API as HTML canvas) |

## Project structure

```
SheepCountGame/
├── app/
│   ├── _layout.tsx        # Root expo-router layout (Stack, StatusBar)
│   ├── index.tsx          # Menu screen (play / view history / top score)
│   ├── game.tsx           # Game screen (session timer, HUD, choice box)
│   └── history.tsx        # History screen (past sessions list)
│
├── components/
│   ├── GameCanvas.tsx     # Canvas rendering + game loop (sheep animation)
│   └── ChoiceButtons.tsx  # Three answer option buttons
│
├── constants/
│   └── game.ts            # TILE, COLS, PLAYABLE_ROWS, corral config, etc.
│
├── hooks/
│   └── useTopScore.ts     # Load/save top score from AsyncStorage
│
├── store/
│   └── sessionStore.ts    # Zustand store: streak + correct/wrong counters
│
├── utils/
│   ├── format.ts          # formatTime(), formatDuration()
│   ├── sheep.ts           # randomSheepCount(), buildOptions()
│   ├── sheepFactory.ts    # buildSheep() — creates flock with corral slots & targets
│   ├── storage.ts         # AsyncStorage helpers (top score + session history)
│   └── trees.ts           # buildTrees() — fixed tree positions for each round
│
├── assets/                # icon.png, splash-icon.png, adaptive-icon.png, favicon.png
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install extra packages (canvas renderer + state + storage)
npx expo install @benjeau/react-native-canvas zustand @react-native-async-storage/async-storage

# 3. Run on Android
npm run android
```

## Game flow

```
Menu ──► Game (5 min session)
              │
              ├─ sheep exit corral one by one (releasing phase)
              ├─ sheep stop in field → 3 options appear (answering phase)
              ├─ user picks → sheep return to corral one by one (returning phase)
              │     └─ big counter increments per sheep entering
              └─ repeat until timer runs out or user ends session
                    └─ saves session record → back to Menu
```

## Safe area

Two zones are off-limits to sheep at all times:
- **Top 4 rows (80px):** reserved for HUD (timer, streak, end-session button)
- **Below row 14 (280px+):** reserved for the choice box at the bottom

These are set via `SAFE_TOP_ROWS` and `PLAYABLE_ROWS` in `constants/game.ts`.
Adjust them if you change the UI layout.
