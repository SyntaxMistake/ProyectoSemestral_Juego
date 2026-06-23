import {
  CORRAL_X,
  CORRAL_Y,
  CORRAL_W,
  CORRAL_H,
  PLAYABLE_ROWS,
  SAFE_TOP_ROWS,
} from "@/constants/game";

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a)) + a;
}

const BASE_POSITIONS = [
  [0, SAFE_TOP_ROWS], [1, SAFE_TOP_ROWS],
  [17, SAFE_TOP_ROWS], [18, SAFE_TOP_ROWS],
  [0, SAFE_TOP_ROWS + 1], [18, SAFE_TOP_ROWS + 1],
  [3, SAFE_TOP_ROWS + 3], [4, SAFE_TOP_ROWS + 3],
  [12, SAFE_TOP_ROWS + 1], [13, SAFE_TOP_ROWS + 1],
  [16, SAFE_TOP_ROWS + 5],
  [10, SAFE_TOP_ROWS], [11, SAFE_TOP_ROWS],
];

export function buildTrees() {
  return BASE_POSITIONS.filter(
    ([x, y]) =>
      y < PLAYABLE_ROWS &&
      !(
        x >= CORRAL_X - 1 &&
        x <= CORRAL_X + CORRAL_W &&
        y >= CORRAL_Y - 1 &&
        y <= CORRAL_Y + CORRAL_H
      )
  ).map(([x, y]) => ({ x, y, type: rnd(0, 3) }));
}
