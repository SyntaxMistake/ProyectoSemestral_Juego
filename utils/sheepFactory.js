import {
  COLS,
  CORRAL_X,
  CORRAL_Y,
  CORRAL_W,
  CORRAL_H,
  SAFE_TOP_ROWS,
} from "@/constants/game";

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a)) + a;
}

// 3 columnas × 3 filas = 9 slots. Spacing 2.5 tiles ≥ ancho visual oveja (~2.25 tiles)
const SLOTS_PER_ROW = 3;
const SLOT_SPACING = 2.5;

function randomCorralSlot(i) {
  const col = i % SLOTS_PER_ROW;
  const row = Math.floor(i / SLOTS_PER_ROW);
  const cx = CORRAL_X + 0.8 + col * SLOT_SPACING + rnd(-8, 8) / 100;
  const cy = CORRAL_Y + 0.8 + row * SLOT_SPACING + rnd(-8, 8) / 100;
  return {
    x: Math.min(cx, CORRAL_X + CORRAL_W - 0.5),
    y: Math.min(cy, CORRAL_Y + CORRAL_H - 0.5),
  };
}

function pickTarget(placed, trees) {
  let tries = 0;
  while (tries < 200) {
    tries++;
    const sx = rnd(2, COLS - 2) + 0.5;
    const sy = rnd(SAFE_TOP_ROWS + 1, CORRAL_Y - 3) + 0.5;
    if (trees.some((t) => t.x === Math.round(sx) && t.y === Math.round(sy))) continue;
    if (placed.some((p) => Math.hypot(p.x - sx, p.y - sy) < 3.0)) continue;
    return { x: sx, y: sy };
  }
  return {
    x: rnd(3, COLS - 3) + 0.5,
    y: rnd(SAFE_TOP_ROWS + 1, CORRAL_Y - 3) + 0.5,
  };
}

export function buildSheep(count, trees) {
  const flock = [];
  const targets = [];

  for (let i = 0; i < count; i++) {
    const slot = randomCorralSlot(i);
    flock.push({
      x: slot.x,
      y: slot.y,
      homeSlot: slot,
      target: null,
      speed: 0.05 + Math.random() * 0.02,
      walkPhase: Math.random() * 10,
      state: "inpen",
      delay: rnd(0, 30),
      counted: false,
    });
    const t = pickTarget(targets, trees);
    targets.push(t);
  }

  return { flock, targets };
}
