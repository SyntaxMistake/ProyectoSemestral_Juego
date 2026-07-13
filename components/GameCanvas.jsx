import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";
import {
  BASE_H,
  BASE_W,
  COLS,
  CORRAL_H,
  CORRAL_W,
  CORRAL_X,
  CORRAL_Y,
  ENTRY_STAGGER_FRAMES,
  PADDING,
  PLAYABLE_ROWS,
  SAFE_TOP_ROWS,
  TILE,
} from "@/constants/game";
import { buildSheep } from "@/utils/sheepFactory";
import { buildOptions, randomSheepCount } from "@/utils/sheep";
import { buildTrees } from "@/utils/trees";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CANVAS_W = SCREEN_W - PADDING * 2;
const CANVAS_H = SCREEN_H - PADDING * 2;

// Multiplicador base de velocidad de caminata (salida, ida al campo y regreso)
const WALK_SPEED_MULT = 10.0;

export function GameCanvas({ phase, correctCount, onSheepReady, onReturnDone, onSheepEntered }) {
  const [, setFrame] = useState(0);

  const flockRef = useRef([]);
  const treesRef = useRef([]);
  const phaseRef = useRef(phase);
  const rafRef = useRef(null);
  const returnQueueRef = useRef([]);
  const returnIndexRef = useRef(0);
  const framesSinceRef = useRef(ENTRY_STAGGER_FRAMES);
  const correctCountRef = useRef(correctCount);
  const enteredCountRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);

  useEffect(() => {
    startQuestion();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (phase === "returning") {
      startReturnSequence();
      startLoop();
    }
  }, [phase]);

  function startQuestion() {
    const count = randomSheepCount();
    treesRef.current = buildTrees();
    const { flock, targets } = buildSheep(count, treesRef.current);
    flock.forEach((s, i) => { s.target = targets[i]; });
    flockRef.current = flock;
    correctCountRef.current = count;
    phaseRef.current = "releasing";
    startLoop();
  }

  function startLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    function tick() {
      if (phaseRef.current === "releasing") updateRelease();
      else if (phaseRef.current === "returning") updateReturn();
      setFrame((f) => f + 1);
      if (phaseRef.current === "releasing" || phaseRef.current === "returning") {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    }
    tick();
  }

  function updateRelease() {
    let allDone = true;
    flockRef.current.forEach((s) => {
      if (s.delay > 0) { s.delay--; allDone = false; return; }
      if (s.state === "inpen") s.state = "walkingout";
      if (s.state === "walkingout") {
        s.walkPhase++;
        const exitX = clampToFront(s.homeSlot.x);
        const doorY = CORRAL_Y - 0.5;
        stepToward(s, exitX, doorY, s.speed * WALK_SPEED_MULT);
        applySeparation(s, flockRef.current);
        if (Math.hypot(s.x - exitX, s.y - doorY) < 0.2) s.state = "toField";
        allDone = false;
      } else if (s.state === "toField") {
        s.walkPhase++;
        const done = stepToward(s, s.target.x, s.target.y, s.speed * WALK_SPEED_MULT);
        // Separación solo mientras está lejos del destino para no bloquear la llegada
        if (!done && Math.hypot(s.x - s.target.x, s.y - s.target.y) > 1.2) {
          applySeparation(s, flockRef.current);
        }
        if (done) s.state = "field";
        else allDone = false;
      }
    });
    if (allDone) {
      phaseRef.current = "answering";
      const opts = buildOptions(correctCountRef.current);
      onSheepReady(correctCountRef.current, opts);
    }
  }

  function startReturnSequence() {
    returnQueueRef.current = [...flockRef.current];
    returnIndexRef.current = 0;
    framesSinceRef.current = ENTRY_STAGGER_FRAMES;
    enteredCountRef.current = 0;
    flockRef.current.forEach((s) => { s.state = "waitingTurn"; s.counted = false; });
  }

  function updateReturn() {
    framesSinceRef.current++;
    const active = flockRef.current.find((s) => s.state === "returning");
    if (
      !active &&
      returnIndexRef.current < returnQueueRef.current.length &&
      framesSinceRef.current >= ENTRY_STAGGER_FRAMES
    ) {
      const next = returnQueueRef.current[returnIndexRef.current];
      next.state = "returning";
      next.walkPhase = Math.random() * 10;
      returnIndexRef.current++;
      framesSinceRef.current = 0;
    }

    let allInPen = true;
    flockRef.current.forEach((s) => {
      if (s.state === "returning") {
        s.walkPhase++;
        const entryX = clampToFront(s.homeSlot.x), doorY = CORRAL_Y - 0.5;
        const atEntryX = Math.abs(s.x - entryX) < 0.2;
        const pastDoor = s.y >= CORRAL_Y - 0.3;
        let tx = entryX, ty = s.y;
        if (!pastDoor) { if (atEntryX) ty = doorY + 0.4; }
        else { tx = s.homeSlot.x; ty = s.homeSlot.y; }
        // Cuanto más lejos está la oveja del corral, más rápido se acerca;
        // al llegar cerca, la velocidad vuelve a la normal.
        const distToCorral = Math.hypot(s.x - entryX, s.y - doorY);
        const speedFactor = Math.min(1 + distToCorral * 0.05, 2.2);
        const RSPD = s.speed * WALK_SPEED_MULT * 1.5 * speedFactor;
        stepToward(s, tx, ty, RSPD);
        if (Math.hypot(s.x - s.homeSlot.x, s.y - s.homeSlot.y) < 0.15) {
          s.x = s.homeSlot.x;
          s.y = s.homeSlot.y;
          s.state = "inpen_done";
          enteredCountRef.current += 1;
          onSheepEntered(enteredCountRef.current);
        } else {
          allInPen = false;
        }
      } else if (s.state !== "inpen_done") {
        allInPen = false;
      }
    });

    if (allInPen) {
      phaseRef.current = "done";
      setTimeout(() => { onReturnDone(); startQuestion(); }, 800);
    }
  }

  // Punto de la cara frontal del corral por el que una oveja puede cruzar,
  // alineado con su propia columna en vez de un único punto fijo (evita cuellos de botella).
  function clampToFront(x) {
    return Math.min(Math.max(x, CORRAL_X + 0.7), CORRAL_X + CORRAL_W - 0.7);
  }

  function stepToward(s, tx, ty, spd) {
    const dx = tx - s.x, dy = ty - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= spd) { s.x = tx; s.y = ty; return true; }
    s.x += (dx / dist) * spd;
    s.y += (dy / dist) * spd;
    return false;
  }

  // Empuja s fuera de cualquier oveja cercana. Solo se aplica durante el movimiento.
  // La distancia mínima coincide con el ancho visual de una oveja (~2.25 tiles) + margen.
  const SEP_DIST = 2.4;
  function applySeparation(s, flock) {
    flock.forEach((other) => {
      if (other === s) return;
      // No empujar contra ovejas que siguen en el corral o ya llegaron
      if (other.state === "inpen" || other.state === "inpen_done") return;
      const dx = s.x - other.x;
      const dy = s.y - other.y;
      const dist = Math.hypot(dx, dy);
      if (dist < SEP_DIST && dist > 0.01) {
        const strength = ((SEP_DIST - dist) / SEP_DIST) * 0.1;
        s.x += (dx / dist) * strength;
        s.y += (dy / dist) * strength;
      }
    });
  }

  // Grass texture — static, computed once
  const grassRects = useMemo(() => {
    const rects = [];
    for (let r = SAFE_TOP_ROWS; r < PLAYABLE_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((c + r * 3) % 7 === 0)
          rects.push(<Rect key={`g1-${r}-${c}`} x={c * TILE + 4} y={r * TILE + 6} width={3} height={3} fill="#4d8c30" />);
        if ((c * 2 + r) % 11 === 0)
          rects.push(<Rect key={`g2-${r}-${c}`} x={c * TILE + 12} y={r * TILE + 2} width={2} height={4} fill="#4d8c30" />);
      }
    }
    return rects;
  }, []);

  return (
    <Svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${BASE_W} ${BASE_H}`}>
      {/* Grass — usa BASE_W para coincidir con el sistema de coordenadas del viewBox */}
      <Rect
        x={0}
        y={SAFE_TOP_ROWS * TILE}
        width={BASE_W}
        height={(PLAYABLE_ROWS - SAFE_TOP_ROWS) * TILE}
        fill="#5a9e3a"
      />
      {grassRects}

      {/* Corral */}
      <Corral />

      {/* Trees — change each round */}
      {treesRef.current.map((t, i) => (
        <TreeEl key={i} tree={t} />
      ))}

      {/* Sheep — re-render every frame */}
      {flockRef.current.map((s, i) => (
        <SheepEl
          key={i}
          sheep={s}
          moving={s.state === "walkingout" || s.state === "toField" || s.state === "returning"}
        />
      ))}
    </Svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Corral() {
  const px = CORRAL_X * TILE, py = CORRAL_Y * TILE;
  const w = CORRAL_W * TILE, h = CORRAL_H * TILE;
  const fenceLines = [];
  for (let i = 1; i < CORRAL_W; i++) {
    fenceLines.push(
      <Line key={i} x1={px + i * TILE} y1={py} x2={px + i * TILE} y2={py + h} stroke="#5a3e1b" strokeWidth={2} />
    );
  }
  // Postes bajos a lo largo de toda la cara frontal: las ovejas pueden
  // entrar/salir por cualquier punto de este lado, no solo por un hueco fijo.
  const frontPosts = [];
  for (let i = 0; i <= CORRAL_W; i++) {
    frontPosts.push(
      <Rect key={`post-${i}`} x={px + i * TILE - 2} y={py - 4} width={4} height={5} fill="#3a2a14" />
    );
  }
  return (
    <G>
      <Rect x={px} y={py} width={w} height={h} fill="#8a7048" />
      <Line x1={px} y1={py} x2={px} y2={py + h} stroke="#5a3e1b" strokeWidth={3} />
      <Line x1={px + w} y1={py} x2={px + w} y2={py + h} stroke="#5a3e1b" strokeWidth={3} />
      <Line x1={px} y1={py + h} x2={px + w} y2={py + h} stroke="#5a3e1b" strokeWidth={3} />
      {fenceLines}
      {frontPosts}
    </G>
  );
}

function TreeEl({ tree }) {
  const px = tree.x * TILE, py = tree.y * TILE;
  if (tree.type === 0) {
    return (
      <G>
        <Circle cx={px + 10} cy={py + 12} r={10} fill="#2d6e1a" />
        <Circle cx={px + 8} cy={py + 8} r={7} fill="#3a8f24" />
        <Rect x={px + 8} y={py + 16} width={4} height={6} fill="#5a3e1b" />
      </G>
    );
  }
  if (tree.type === 1) {
    return (
      <G>
        <Circle cx={px + 10} cy={py + 12} r={10} fill="#d4851a" />
        <Circle cx={px + 8} cy={py + 8} r={7} fill="#e8a030" />
        <Rect x={px + 8} y={py + 16} width={4} height={6} fill="#5a3e1b" />
      </G>
    );
  }
  return (
    <G>
      <Path
        d={`M${px + 10},${py + 1} L${px + 18},${py + 14} L${px + 15},${py + 14} L${px + 17},${py + 20} L${px + 3},${py + 20} L${px + 5},${py + 14} L${px + 2},${py + 14} Z`}
        fill="#1a5c0f"
      />
      <Path
        d={`M${px + 10},${py + 3} L${px + 16},${py + 13} L${px + 4},${py + 13} Z`}
        fill="#2a7a1a"
      />
    </G>
  );
}

const SHEEP_SCALE = 2.5;

// ─── Oveja en pixel art ─────────────────────────────────────────────────────
// La oveja se define como una cuadrícula de "pixeles" (cada carácter = 1 celda)
// en vez de formas suaves, para lograr el look bloque-a-bloque de un sprite
// retro. La parte superior (lana) es simétrica y se genera espejando la mitad
// izquierda; la cara/orejas/patas se escriben a ancho completo porque la cara
// va desplazada hacia un lado, como en el sprite de referencia.
const PIXEL_COLORS = {
  W: "#f7f7f5", // lana clara
  w: "#dcdcd8", // lana sombra
  F: "#e3b98a", // cara / patas
  f: "#c99a68", // cara / patas (sombra)
  K: "#1a1a1a", // ojo
  n: "#7a5636", // nariz
  H: "#3a2a1a", // pezuña
};

function mirrorRow(row) {
  return row + row.slice(0, -1).split("").reverse().join("");
}

const SHEEP_TOP_HALF = [
  "....WW...",
  "...WWWW..",
  "..WWWWWW.",
  ".WWWWWWWW",
  "WWWWWWWWW",
  "WWWWWWWWW",
  "WWWWWWWWW",
];

const SHEEP_BOTTOM_ROWS = [
  "WWWWWWWWWWFFWWFFW",
  "WWWWWWWWWWfFWWFfW",
  "WWWWWWWWWWFFFFFFW",
  "WWWWWWWWWFFFFFFFF",
  "WWWWWWWWWFFFKFFFf",
  "WWWWWWWWWfFFFFFFf",
  "WWWWWWWWWWFFnFFFW",
  "..FF..FF.FF..FF..",
  "..HH..HH.HH..HH..",
];

const SHEEP_GRID = [...SHEEP_TOP_HALF.map(mirrorRow), ...SHEEP_BOTTOM_ROWS];
const SHEEP_GRID_ROWS = SHEEP_GRID.length;
const SHEEP_GRID_COLS = SHEEP_GRID[0].length;

// Rango de columnas de cada pata, solo relevante en las 2 últimas filas (patas/pezuñas)
const LEG_COL_RANGES = { A: [2, 3], B: [6, 7], C: [9, 10], D: [13, 14] };
// Patas diagonales opuestas se balancean juntas, como un trote real
const LEG_SWING_SIGN = { A: 1, B: -1, C: -1, D: 1 };

function legIdForCol(c) {
  for (const id of Object.keys(LEG_COL_RANGES)) {
    const [a, b] = LEG_COL_RANGES[id];
    if (c >= a && c <= b) return id;
  }
  return null;
}

// Tamaño de cada celda en unidades locales (antes de aplicar SHEEP_SCALE)
const PIX = 1.2;
// Ligero solape para que no queden líneas finas entre celdas adyacentes
const PIX_OVERLAP = 0.05;

const SHEEP_CELLS = (() => {
  const originX = -(SHEEP_GRID_COLS * PIX) / 2;
  const originY = -(SHEEP_GRID_ROWS * PIX) / 2;
  const cells = [];
  SHEEP_GRID.forEach((row, r) => {
    const isLegRow = r >= SHEEP_GRID_ROWS - 2;
    for (let c = 0; c < row.length; c++) {
      const color = PIXEL_COLORS[row[c]];
      if (!color) continue;
      cells.push({
        x: originX + c * PIX,
        y: originY + r * PIX,
        color,
        leg: isLegRow ? legIdForCol(c) : null,
      });
    }
  });
  return cells;
})();

function SheepEl({ sheep: s, moving }) {
  const px = s.x * TILE, py = s.y * TILE;
  const phase = s.walkPhase * 0.35;
  const wob = moving ? Math.sin(phase) * 1.3 : 0;
  const hop = moving ? -Math.abs(Math.sin(phase)) * 1.1 : 0;
  const legSwing = moving ? Math.sin(phase) * 1.4 : 0;

  return (
    <G x={px} y={py + hop} scale={SHEEP_SCALE}>
      {SHEEP_CELLS.map((cell, i) => (
        <Rect
          key={i}
          x={cell.leg ? cell.x + LEG_SWING_SIGN[cell.leg] * legSwing : cell.x}
          y={cell.y + wob}
          width={PIX + PIX_OVERLAP}
          height={PIX + PIX_OVERLAP}
          fill={cell.color}
        />
      ))}
    </G>
  );
}
