import { Dimensions } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export const PADDING = 32;
export const TILE = 20;
export const COLS = 19;

// Dimensiones del canvas en píxeles físicos
const CANVAS_W = SCREEN_W - PADDING * 2;
const CANVAS_H = SCREEN_H - PADDING * 2;

// Sistema de coordenadas interno del viewBox (igual para todos los dispositivos)
export const BASE_W = COLS * TILE; // 380

// Cuántas filas de tiles caben en el alto disponible, manteniendo la misma
// escala horizontal que BASE_W/CANVAS_W
export const TOTAL_ROWS = Math.ceil(CANVAS_H * COLS / CANVAS_W);
export const BASE_H = TOTAL_ROWS * TILE;

export const SAFE_TOP_ROWS = 4;
export const PLAYABLE_ROWS = TOTAL_ROWS;

export const SESSION_SECONDS = 5 * 60;

// Corral proporcional a ovejas 2.5×: 8×7 tiles
// Se ubica al final de la pantalla dejando ~9 filas para que no quede
// tapado por el cuadro de respuestas inferior
export const CORRAL_X = 1;
export const CORRAL_W = 9;  // 3 cols × 2.5 spacing = 7.5 tiles, con margen en CORRAL_W=9
export const CORRAL_H = 8;  // 3 rows × 2.5 spacing = 7.5 tiles, con margen en CORRAL_H=8
export const CORRAL_Y = TOTAL_ROWS - CORRAL_H - 9;

export const ENTRY_STAGGER_FRAMES = 22;
