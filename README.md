# Sheep Count Game

Juego de conteo de ovejas en vista cenital, construido con Expo (React Native).

## Stack tecnológico

| Paquete                                     | Propósito                                                       |
| ------------------------------------------- | --------------------------------------------------------------- |
| `expo ~52` + `expo-router ~4`               | Navegación y herramientas de build                              |
| `react-native-svg ~15.8`                    | Renderizado SVG con sistema de coordenadas viewBox              |
| `react-native-safe-area-context`            | Márgenes de área segura en dispositivos con notch               |
| `react-native-screens ~4.4`                 | Contenedores nativos de pantalla usados por expo-router         |
| `@react-native-async-storage/async-storage` | Persistencia de puntuación máxima e historial en el dispositivo |
| `zustand ^5`                                | Estado en memoria de la sesión (racha, aciertos/errores)        |

## Estructura del proyecto

```
SheepCountGame/
├── app/
│   ├── _layout.jsx        # Layout raíz de expo-router (Stack, StatusBar)
│   ├── index.jsx          # Pantalla de menú (jugar / historial / puntuación máxima)
│   ├── game.jsx           # Pantalla de juego (temporizador, HUD, caja de respuestas, contador de entrada)
│   └── history.jsx        # Pantalla de historial (lista de sesiones anteriores)
│
├── components/
│   ├── GameCanvas.jsx     # Canvas SVG + bucle de juego con requestAnimationFrame
│   └── ChoiceButtons.jsx  # Tres botones de respuesta
│
├── constants/
│   └── game.js            # TILE, COLS, TOTAL_ROWS, configuración del corral — derivados del tamaño de pantalla
│
├── hooks/
│   └── useTopScore.js     # Carga y guarda la puntuación máxima en AsyncStorage
│
├── store/
│   └── sessionStore.js    # Store de Zustand: racha + contadores de aciertos/errores
│
├── utils/
│   ├── format.js          # formatTime(), formatDuration()
│   ├── sheep.js           # randomSheepCount() → 3–9, buildOptions()
│   ├── sheepFactory.js    # buildSheep() — slots del corral (3×3) + objetivos en el campo
│   ├── storage.js         # Helpers de AsyncStorage (puntuación máxima + historial)
│   └── trees.js           # buildTrees() — posiciones aleatorias de árboles por ronda
│
├── assets/
├── app.json
├── babel.config.js
├── jsconfig.json          # Alias de ruta @/ para el transform de babel de Expo
└── package.json
```

## Instalación

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Ejecutar en simulador iOS
npm run ios

# 3. Ejecutar en Android
npm run android
```

## Flujo del juego

```
Menú ──► Juego (sesión de 5 min)
              │
              ├─ las ovejas salen del corral y se dispersan por el campo (releasing)
              ├─ las ovejas se detienen → aparecen 3 opciones de respuesta (answering)
              ├─ el jugador elige → las ovejas vuelven al corral de una en una (returning)
              │     └─ un número grande rebota en pantalla contando cada oveja que entra
              └─ se repite hasta que el temporizador llega a cero o el jugador termina
                    └─ guarda el registro de la sesión → vuelve al Menú
```
