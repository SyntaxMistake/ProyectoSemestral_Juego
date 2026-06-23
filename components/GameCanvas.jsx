import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import {
  BASE_H,
  BASE_W,
  COLS,
  CORRAL_DOOR_X,
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
        const doorX = CORRAL_DOOR_X + 0.5, doorY = CORRAL_Y - 0.5;
        stepToward(s, doorX, doorY, s.speed * 1.4);
        applySeparation(s, flockRef.current);
        if (Math.hypot(s.x - doorX, s.y - doorY) < 0.2) s.state = "toField";
        allDone = false;
      } else if (s.state === "toField") {
        s.walkPhase++;
        const done = stepToward(s, s.target.x, s.target.y, s.speed * 1.4);
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
        const RSPD = s.speed * 1.4 * 1.5;
        const doorX = CORRAL_DOOR_X + 0.5, doorY = CORRAL_Y - 0.5;
        const atDoorX = Math.abs(s.x - doorX) < 0.2;
        const pastDoor = s.y >= CORRAL_Y - 0.3;
        let tx = doorX, ty = s.y;
        if (!pastDoor) { if (atDoorX) ty = doorY + 0.4; }
        else { tx = s.homeSlot.x; ty = s.homeSlot.y; }
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
  return (
    <G>
      <Rect x={px} y={py} width={w} height={h} fill="#8a7048" stroke="#5a3e1b" strokeWidth={3} />
      {fenceLines}
      <Rect x={px + TILE - 3} y={py - 3} width={6} height={6} fill="#3a2a14" />
      <Rect x={px + 2 * TILE - 3} y={py - 3} width={6} height={6} fill="#3a2a14" />
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

function SheepEl({ sheep: s, moving }) {
  const px = s.x * TILE, py = s.y * TILE;
  const wob = moving ? Math.sin(s.walkPhase * 0.35) * 1.5 : 0;
  const legOff = moving ? Math.sin(s.walkPhase * 0.35) * 3 : 0;
  const woolSpots = [[-3, -1], [3, -1], [0, -3], [-2, 2], [2, 2]];

  return (
    <G x={px} y={py} scale={SHEEP_SCALE}>
      <Ellipse cx={0} cy={5 + wob} rx={4} ry={3} fill="#888" />
      {woolSpots.map(([dx, dy], i) => (
        <Circle key={i} cx={dx} cy={dy + wob} r={6} fill="#ccc" />
      ))}
      <Ellipse cx={0} cy={1 + wob} rx={8} ry={6} fill="#ccc" />
      <Circle cx={-4} cy={-4 + wob} r={5} fill="#555" />
      <Circle cx={-5} cy={-5 + wob} r={3} fill="#eee" />
      <Circle cx={-6} cy={-6 + wob} r={1.5} fill="#111" />
      <Rect x={-6} y={5 + wob + legOff} width={3} height={5} fill="#e8c8a0" />
      <Rect x={-1} y={5 + wob - legOff} width={3} height={5} fill="#e8c8a0" />
      <Rect x={3} y={5 + wob + legOff} width={3} height={5} fill="#e8c8a0" />
      <Rect x={-3} y={6 + wob - legOff} width={3} height={5} fill="#e8c8a0" />
    </G>
  );
}
