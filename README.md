# Sheep Count Game

Juego de conteo de ovejas en vista cenital, construido con Expo (React Native).

## Stack tecnológico

| Paquete | Propósito |
|---|---|
| `expo ~52` + `expo-router ~4` | Navegación y herramientas de build |
| `react-native-svg ~15.8` | Renderizado SVG con sistema de coordenadas viewBox |
| `react-native-safe-area-context` | Márgenes de área segura en dispositivos con notch |
| `react-native-screens ~4.4` | Contenedores nativos de pantalla usados por expo-router |
| `@react-native-async-storage/async-storage` | Persistencia de puntuación máxima e historial en el dispositivo |
| `zustand ^5` | Estado en memoria de la sesión (racha, aciertos/errores) |

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

## Renderizado

El juego renderiza con `react-native-svg` usando un sistema de coordenadas interno fijo (`viewBox`):

- **Cuadrícula interna:** `COLS × TOTAL_ROWS` tiles, cada tile `20×20 px` en el espacio del viewBox
- **Tamaño en pantalla:** `CANVAS_W = SCREEN_W − 64`, `CANVAS_H = SCREEN_H − 64` (32 px de padding en todos los lados)
- **Escala:** calculada automáticamente por el `viewBox` del SVG; toda la lógica del juego usa coordenadas en tiles
- `TOTAL_ROWS` se calcula al iniciar la app desde la altura real del dispositivo para que el canvas llene el espacio disponible en cualquier pantalla

## Zonas del canvas

| Zona | Filas | Propósito |
|---|---|---|
| HUD | 0–3 | Temporizador, racha, botón de terminar sesión (overlay absoluto) |
| Campo | 4 – `CORRAL_Y − 3` | Las ovejas pastan aquí; los árboles aparecen aquí |
| Corral | `CORRAL_Y` – `TOTAL_ROWS − 10` | Establo de 9×8 tiles; cuadrícula de slots 3×3 |
| Margen caja de respuestas | últimas ~9 filas | Libre para que los botones de respuesta no tapen el corral |

## Ovejas

- **Escala:** `SHEEP_SCALE = 2.5` aplicado al grupo SVG de cada oveja (~2.25 tiles de ancho visual)
- **Slots del corral:** 3 columnas × 3 filas, `SLOT_SPACING = 2.5` tiles (≥ ancho de la oveja, sin solapamiento)
- **Objetivos en el campo:** separación mínima de 3.0 tiles entre centros de oveja
- **Fuerza de separación:** aplicada en los estados `walkingout` y `toField` para evitar que las ovejas se atraviesen durante el movimiento
- **Cantidad por ronda:** 3–9 ovejas (coincide con la capacidad 3×3 del corral)

## Constantes (`constants/game.js`)

Todos los valores de layout se exportan desde un único archivo. `CORRAL_Y` y `TOTAL_ROWS` dependen de las dimensiones reales de la pantalla en tiempo de ejecución.

| Constante | Valor | Descripción |
|---|---|---|
| `TILE` | 20 | Píxeles por tile en el espacio del viewBox |
| `COLS` | 19 | Columnas de la cuadrícula (BASE_W = 380 px) |
| `TOTAL_ROWS` | ~46 en iPhone 14 | Calculado desde la altura de pantalla |
| `BASE_H` | `TOTAL_ROWS × TILE` | Alto del viewBox |
| `SAFE_TOP_ROWS` | 4 | Filas reservadas para el HUD |
| `CORRAL_X / Y` | 1 / dinámico | Esquina superior izquierda del corral (coords en tiles) |
| `CORRAL_W / H` | 9 / 8 | Tamaño del corral en tiles |
| `SESSION_SECONDS` | 300 | Duración de la sesión (5 min) |
| `ENTRY_STAGGER_FRAMES` | 22 | Fotogramas entre cada oveja al entrar en la vuelta |
